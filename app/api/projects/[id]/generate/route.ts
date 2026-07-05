import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { anthropic, CLAUDE_MODEL } from "@/lib/claude/client";
import { buildArticleGenerationPrompt } from "@/lib/claude/prompts";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  // ログイン中の管理者のセッションで取得することで、RLSにより
  // 「自分が作った案件かどうか」を自動的にチェックする。
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) {
    return NextResponse.json({ error: "案件が見つかりません。" }, { status: 404 });
  }

  const { data: session } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "回答データがまだありません。" }, { status: 400 });
  }

  const { data: messages } = await supabase
    .from("interview_messages")
    .select("*")
    .eq("session_id", session.id)
    .order("created_at", { ascending: true });

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: "回答データがまだありません。" }, { status: 400 });
  }

  const prompt = buildArticleGenerationPrompt(project, messages);
  const maxTokens = Math.min(8192, Math.max(2048, project.word_count * 2));

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  const articleContent = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  // generated_articles / projects への書き込みはservice role keyで行う
  // (認証ユーザー向けのinsert/updateポリシーを用意していないため)。
  const adminSupabase = createAdminSupabaseClient();

  const { error: upsertError } = await adminSupabase
    .from("generated_articles")
    .upsert({ project_id: projectId, content: articleContent }, { onConflict: "project_id" });

  if (upsertError) {
    return NextResponse.json({ error: "記事の保存に失敗しました。" }, { status: 500 });
  }

  await adminSupabase.from("projects").update({ status: "generated" }).eq("id", projectId);

  return NextResponse.json({ content: articleContent });
}
