import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude/client";
import { buildInterviewSystemPrompt, INTERVIEW_COMPLETE_MARKER } from "@/lib/claude/prompts";
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

async function askClaude(project: Project, history: Pick<InterviewMessage, "role" | "content">[]) {
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
  const content = rawText.replace(INTERVIEW_COMPLETE_MARKER, "").trim();

  return { content, completed };
}

async function getProjectByToken(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  token: string
) {
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("share_token", token)
    .single();

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

  // 新しいセッションの場合は、AIからの最初の質問を生成して保存する。
  if (isNew && allMessages.length === 0) {
    const { content } = await askClaude(project, []);

    const { data: firstMessage } = await supabase
      .from("interview_messages")
      .insert({ session_id: session.id, role: "assistant", content })
      .select("*")
      .single();

    if (firstMessage) {
      allMessages = [firstMessage];
    }
  }

  return NextResponse.json({
    sessionStatus: session.status,
    messages: allMessages,
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

  const { content, completed } = await askClaude(project, history ?? []);

  const { data: savedAssistantMessage, error: assistantInsertError } = await supabase
    .from("interview_messages")
    .insert({ session_id: session.id, role: "assistant", content })
    .select("*")
    .single();

  if (assistantInsertError || !savedAssistantMessage) {
    return NextResponse.json({ error: "AI応答の保存に失敗しました。" }, { status: 500 });
  }

  if (completed) {
    await supabase.from("interview_sessions").update({ status: "completed" }).eq("id", session.id);
    await supabase.from("projects").update({ status: "completed" }).eq("id", project.id);
  }

  return NextResponse.json({
    userMessage: savedUserMessage,
    assistantMessage: savedAssistantMessage,
    completed,
  });
}
