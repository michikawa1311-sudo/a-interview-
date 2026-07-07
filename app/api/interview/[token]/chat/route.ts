import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude/client";
import {
  buildInterviewSystemPrompt,
  INTERVIEW_COMPLETE_MARKER,
  PROGRESS_MARKER_REGEX,
} from "@/lib/claude/prompts";
import type { InterviewMessage, Project } from "@/lib/types";

// DB上の会話履歴をClaude APIのmessages形式に変換する。
// 最初のメッセージがassistant(AIからの最初の質問)の場合、Claude APIは
// 「最初はuserロールから始まる必要がある」という制約があるため、
// DBには保存しない「会話開始」用のuserメッセージを先頭に補う。
function toClaudeMessages(messages: Pick<InterviewMessage, "role" | "content">[]) {
  const claudeMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  if (claudeMessages.length === 0 || claudeMessages[0].role === "assistant") {
    claudeMessages.unshift({
      role: "user" as const,
      content: "インタビューを開始してください。最初の質問をしてください。",
    });
  }

  return claudeMessages;
}

// システムプロンプトが想定しているやりとりの目安回数(7〜10回)の中間値。
// AIが進捗マーカーを付け忘れた場合の最低保証ラインの計算に使う。
const EXPECTED_TOTAL_TURNS = 8;

async function askClaude(
  project: Project,
  history: Pick<InterviewMessage, "role" | "content">[],
  previousProgress: number
) {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: buildInterviewSystemPrompt(project),
    messages: toClaudeMessages(history),
  });

  const rawText = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  const completed = rawText.includes(INTERVIEW_COMPLETE_MARKER);
  const progressMatch = rawText.match(PROGRESS_MARKER_REGEX);

  // AIは指示に従わず進捗マーカーを付け忘れることがあるため、
  // 「これまでのAIの応答回数 / 想定合計ターン数」による最低保証ラインを設け、
  // マーカーがあってもなくても進捗が後退したり止まったりしないようにする。
  const assistantTurnNumber = history.filter((m) => m.role === "assistant").length + 1;
  const turnBasedFloor = Math.min(95, Math.round((assistantTurnNumber / EXPECTED_TOTAL_TURNS) * 100));

  const reportedProgress = progressMatch ? Number(progressMatch[1]) : 0;

  const progress = completed
    ? 100
    : Math.min(100, Math.max(previousProgress, turnBasedFloor, reportedProgress));

  const content = rawText
    .replace(INTERVIEW_COMPLETE_MARKER, "")
    .replace(PROGRESS_MARKER_REGEX, "")
    .trim();

  return { content, completed, progress };
}

async function getProjectByToken(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  token: string
) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("share_token", token)
    .single();

  if (error) {
    // 案件が本当に存在しない場合だけでなく、Supabaseの環境変数(URL/service role key)が
    // 誤っている場合もここでエラーになる。原因切り分けのためログに残す。
    console.error("[getProjectByToken] Supabaseエラー:", error.message, "token:", token);
  }

  return project;
}

async function getOrCreateSession(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  projectId: string
) {
  const { data: existing } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return { session: existing, isNew: false };

  const { data: created, error } = await supabase
    .from("interview_sessions")
    .insert({ project_id: projectId })
    .select("*")
    .single();

  if (error || !created) {
    throw new Error(`セッションの作成に失敗しました: ${error?.message}`);
  }

  return { session: created, isNew: true };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createAdminSupabaseClient();

  const project = await getProjectByToken(supabase, token);
  if (!project) {
    return NextResponse.json({ error: "リンクが見つかりません。" }, { status: 404 });
  }

  const { session, isNew } = await getOrCreateSession(supabase, project.id);

  if (isNew && project.status === "draft") {
    await supabase.from("projects").update({ status: "in_progress" }).eq("id", project.id);
  }

  const { data: messages } = await supabase
    .from("interview_messages")
    .select("*")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true });

  let allMessages = messages ?? [];

  let progress = session.progress;

  // 新しいセッションの場合は、AIからの最初の質問を生成して保存する。
  if (isNew && allMessages.length === 0) {
    const { content, progress: initialProgress } = await askClaude(project, [], 0);

    const { data: firstMessage } = await supabase
      .from("interview_messages")
      .insert({ session_id: session.id, role: "assistant", content })
      .select("*")
      .single();

    if (firstMessage) {
      allMessages = [firstMessage];
      progress = initialProgress;
      await supabase
        .from("interview_sessions")
        .update({ progress })
        .eq("id", session.id);
    }
  }

  return NextResponse.json({
    sessionStatus: session.status,
    messages: allMessages,
    progress,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json().catch(() => null);
  const userMessage = typeof body?.message === "string" ? body.message.trim() : "";

  if (!userMessage) {
    return NextResponse.json({ error: "メッセージを入力してください。" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const project = await getProjectByToken(supabase, token);
  if (!project) {
    return NextResponse.json({ error: "リンクが見つかりません。" }, { status: 404 });
  }

  const { session } = await getOrCreateSession(supabase, project.id);

  if (session.status === "completed") {
    return NextResponse.json({ error: "このインタビューはすでに終了しています。" }, { status: 400 });
  }

  const { data: savedUserMessage, error: userInsertError } = await supabase
    .from("interview_messages")
    .insert({ session_id: session.id, role: "user", content: userMessage })
    .select("*")
    .single();

  if (userInsertError || !savedUserMessage) {
    return NextResponse.json({ error: "メッセージの保存に失敗しました。" }, { status: 500 });
  }

  const { data: history } = await supabase
    .from("interview_messages")
    .select("*")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true });

  const { content, completed, progress } = await askClaude(project, history ?? [], session.progress);

  const { data: savedAssistantMessage, error: assistantInsertError } = await supabase
    .from("interview_messages")
    .insert({ session_id: session.id, role: "assistant", content })
    .select("*")
    .single();

  if (assistantInsertError || !savedAssistantMessage) {
    return NextResponse.json({ error: "AI応答の保存に失敗しました。" }, { status: 500 });
  }

  if (completed) {
    await supabase
      .from("interview_sessions")
      .update({ status: "completed", progress })
      .eq("id", session.id);
    await supabase.from("projects").update({ status: "completed" }).eq("id", project.id);
  } else {
    await supabase.from("interview_sessions").update({ progress }).eq("id", session.id);
  }

  return NextResponse.json({
    userMessage: savedUserMessage,
    assistantMessage: savedAssistantMessage,
    completed,
    progress,
  });
}

// 回答者が「途中で回答内容を編集したい」場合に使うAPI。
// インタビュー進行中(セッション未完了)の、自分自身のメッセージ(role: user)のみ編集できる。
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json().catch(() => null);
  const messageId = typeof body?.messageId === "string" ? body.messageId : "";
  const newContent = typeof body?.content === "string" ? body.content.trim() : "";

  if (!messageId || !newContent) {
    return NextResponse.json({ error: "編集内容が不正です。" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const project = await getProjectByToken(supabase, token);
  if (!project) {
    return NextResponse.json({ error: "リンクが見つかりません。" }, { status: 404 });
  }

  const { session } = await getOrCreateSession(supabase, project.id);

  if (session.status === "completed") {
    return NextResponse.json({ error: "終了したインタビューの回答は編集できません。" }, { status: 400 });
  }

  const { data: targetMessage } = await supabase
    .from("interview_messages")
    .select("*")
    .eq("id", messageId)
    .eq("session_id", session.id)
    .eq("role", "user")
    .maybeSingle();

  if (!targetMessage) {
    return NextResponse.json({ error: "編集対象のメッセージが見つかりません。" }, { status: 404 });
  }

  const { data: updatedMessage, error: updateError } = await supabase
    .from("interview_messages")
    .update({ content: newContent })
    .eq("id", messageId)
    .select("*")
    .single();

  if (updateError || !updatedMessage) {
    return NextResponse.json({ error: "回答の更新に失敗しました。" }, { status: 500 });
  }

  // 編集した回答より後のやり取りは、古い(誤った)内容をもとにAIが考えたものなので、
  // 一度破棄したうえで、編集後の内容をもとにAIの返答を考え直す。
  await supabase
    .from("interview_messages")
    .delete()
    .eq("session_id", session.id)
    .gt("created_at", updatedMessage.created_at);

  const { data: history } = await supabase
    .from("interview_messages")
    .select("*")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true });

  const { content, completed, progress } = await askClaude(project, history ?? [], session.progress);

  const { data: newAssistantMessage, error: assistantInsertError } = await supabase
    .from("interview_messages")
    .insert({ session_id: session.id, role: "assistant", content })
    .select("*")
    .single();

  if (assistantInsertError || !newAssistantMessage) {
    return NextResponse.json({ error: "AI応答の再生成に失敗しました。" }, { status: 500 });
  }

  if (completed) {
    await supabase
      .from("interview_sessions")
      .update({ status: "completed", progress })
      .eq("id", session.id);
    await supabase.from("projects").update({ status: "completed" }).eq("id", project.id);
  } else {
    await supabase.from("interview_sessions").update({ progress }).eq("id", session.id);
  }

  return NextResponse.json({
    message: updatedMessage,
    assistantMessage: newAssistantMessage,
    completed,
    progress,
  });
}
