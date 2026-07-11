import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { InterviewProfile } from "@/lib/types";
import MediaPostForm from "../../posts/MediaPostForm";
import { publishMediaPost } from "../../posts/actions";

// 記事本文の最初のH1見出し(# ではじまる行)をタイトル候補として取り出す。
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

export default async function PublishMediaPostPage({
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

  const { data: article } = await supabase
    .from("generated_articles")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (!article) {
    notFound();
  }

  // 回答者が事前アンケートで入力した基本情報を、公開フォームの初期値に反映する。
  const { data: session } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const profile: InterviewProfile = session?.profile ?? {};

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-900">記事をメディアに公開</h1>
      <p className="mb-6 text-sm text-gray-500">
        公開すると「うちのトリマーさん」のサイトに掲載されます。回答者が事前アンケートで入力した基本情報は自動で反映済みです。本文は公開前に自由に修正できます(公開後も編集可能です)。
      </p>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <MediaPostForm
          action={publishMediaPost}
          projectId={project.id}
          defaults={{
            title: extractTitle(article.content),
            trimmer_name:
              profile.name ?? (project.article_type === "個人インタビュー" ? project.theme : ""),
            salon_name:
              profile.salon_name ?? (project.article_type === "店舗紹介" ? project.theme : ""),
            address: profile.address ?? "",
            phone_number: profile.phone_number ?? "",
            tagline: profile.comment ?? "",
            website_url: profile.website_url ?? "",
            instagram_url: profile.sns_url ?? "",
            content: article.content,
          }}
          submitLabel="公開する"
        />
      </div>
    </div>
  );
}
