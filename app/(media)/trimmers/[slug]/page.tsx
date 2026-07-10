import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function getPost(slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data: post } = await supabase
    .from("media_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return post;
}

// Markdown記法を取り除いた冒頭部分を、検索結果に表示される説明文として使う。
function buildDescription(content: string): string {
  return content
    .replace(/^#.+$/gm, "")
    .replace(/[*_`>\[\]()#-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: "記事が見つかりません | うちのトリマーさん" };
  }

  return {
    title: `${post.title} | うちのトリマーさん`,
    description: buildDescription(post.content),
  };
}

export default async function TrimmerArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <article>
      <p className="mb-6 text-xs font-medium text-amber-700">
        {post.area} / {post.salon_name} / {post.trimmer_name}さん
      </p>

      <div
        className="
          text-[15px] leading-relaxed text-gray-800
          [&>h1]:mb-6 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:leading-snug [&>h1]:text-gray-900
          [&>h2]:mb-3 [&>h2]:mt-10 [&>h2]:border-b [&>h2]:border-amber-200 [&>h2]:pb-2 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-gray-900
          [&>h3]:mb-2 [&>h3]:mt-6 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-gray-900
          [&>p]:mb-4
          [&>ul]:mb-4 [&>ul]:list-disc [&>ul]:pl-6
          [&>ol]:mb-4 [&>ol]:list-decimal [&>ol]:pl-6
          [&>blockquote]:mb-4 [&>blockquote]:border-l-4 [&>blockquote]:border-amber-300 [&>blockquote]:pl-4 [&>blockquote]:text-gray-600
        "
      >
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      {(post.instagram_url || post.website_url) && (
        <div className="mt-10 rounded-xl border border-amber-100 bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-gray-900">
            {post.trimmer_name}さん({post.salon_name})の情報
          </h2>
          <ul className="space-y-1 text-sm">
            {post.website_url && (
              <li>
                <a
                  href={post.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-700 underline underline-offset-2 hover:text-amber-900"
                >
                  ウェブサイト・ご予約はこちら
                </a>
              </li>
            )}
            {post.instagram_url && (
              <li>
                <a
                  href={post.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-700 underline underline-offset-2 hover:text-amber-900"
                >
                  Instagram
                </a>
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="mt-10">
        <Link href="/" className="text-sm font-medium text-amber-700 hover:text-amber-900">
          ← 他のトリマーさんの記事を見る
        </Link>
      </div>
    </article>
  );
}
