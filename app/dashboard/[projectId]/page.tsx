import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import InterviewLink from "./InterviewLink";
import GenerateArticleButton from "./GenerateArticleButton";
import CopyButton from "./CopyButton";
import DeleteProjectButton from "./DeleteProjectButton";

const STATUS_LABEL: Record<string, string> = {
  draft: "回答待ち(まだ誰も回答していません)",
  in_progress: "回答中",
  completed: "回答完了(記事を生成できます)",
  generated: "記事生成済み",
};

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) {
    notFound();
  }

  const { data: session } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: messages } = session
    ? await supabase
        .from("interview_messages")
        .select("*")
        .eq("session_id", session.id)
        .order("created_at", { ascending: true })
    : { data: null };

  const { data: article } = await supabase
    .from("generated_articles")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  const canGenerate = session?.status === "completed";

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const interviewUrl = `${protocol}://${host}/interview/${project.share_token}`;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {project.article_type} / {project.theme}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {STATUS_LABEL[project.status] ?? project.status}
          </p>
        </div>
        <DeleteProjectButton projectId={project.id} />
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">インタビュー用リンク</h2>
        <InterviewLink url={interviewUrl} />
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
          <div>
            <dt className="text-gray-400">読者ターゲット</dt>
            <dd>{project.target_reader}</dd>
          </div>
          <div>
            <dt className="text-gray-400">トーン</dt>
            <dd>{project.tone}</dd>
          </div>
          <div>
            <dt className="text-gray-400">目標文字数</dt>
            <dd>{project.word_count}文字</dd>
          </div>
          <div>
            <dt className="text-gray-400">写真</dt>
            <dd>{project.has_photo ? "あり" : "なし"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-900">回答内容(チャット履歴)</h2>
        {!messages || messages.length === 0 ? (
          <p className="text-sm text-gray-500">まだ回答がありません。</p>
        ) : (
          <ul className="max-h-96 space-y-3 overflow-y-auto">
            {messages.map((m) => (
              <li
                key={m.id}
                className={m.role === "assistant" ? "text-gray-700" : "text-gray-900"}
              >
                <span className="mr-2 text-xs font-semibold text-gray-400">
                  {m.role === "assistant" ? "AI" : "回答者"}
                </span>
                <span className="whitespace-pre-wrap text-sm">{m.content}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">生成記事</h2>
          {article && <CopyButton text={article.content} label="記事をコピー" />}
        </div>

        {!canGenerate && !article && (
          <p className="text-sm text-gray-500">
            回答が完了すると記事を生成できるようになります。
          </p>
        )}

        {canGenerate && (
          <div className="mb-4">
            <GenerateArticleButton projectId={project.id} hasExistingArticle={!!article} />
          </div>
        )}

        {article && (
          <div className="whitespace-pre-wrap rounded-md bg-gray-50 p-4 text-sm text-gray-800">
            {article.content}
          </div>
        )}
      </section>
    </div>
  );
}
