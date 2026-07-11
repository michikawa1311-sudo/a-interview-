import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { MediaPost } from "@/lib/types";

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
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
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

// 電話・公式サイトの予約ボタン。どちらも未設定の場合は何も表示しない。
function ReservationButtons({ post }: { post: MediaPost }) {
  if (!post.phone_number && !post.website_url) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {post.phone_number && (
        <a
          href={`tel:${post.phone_number.replace(/[^\d+]/g, "")}`}
          className="flex-1 rounded-full bg-amber-600 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-amber-700"
        >
          電話で予約する({post.phone_number})
        </a>
      )}
      {post.website_url && (
        <a
          href={post.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-full border-2 border-amber-600 bg-white px-6 py-3 text-center text-sm font-bold text-amber-700 transition hover:bg-amber-50"
        >
          公式サイトで予約する
        </a>
      )}
    </div>
  );
}

// 記事上部に表示するトリマーのプロフィールカード。
function ProfileCard({ post }: { post: MediaPost }) {
  return (
    <div className="rounded-2xl border border-amber-100 bg-white p-6">
      <p className="mb-1 text-xs font-medium text-amber-700">{post.area}</p>
      <h2 className="text-lg font-bold text-gray-900">
        {post.salon_name} / {post.trimmer_name}さん
      </h2>
      {post.tagline && (
        <p className="mt-2 border-l-4 border-amber-300 pl-3 text-sm leading-relaxed text-gray-600">
          {post.tagline}
        </p>
      )}
      <dl className="mt-4 space-y-1 text-sm text-gray-600">
        {post.address && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-gray-400">住所</dt>
            <dd>{post.address}</dd>
          </div>
        )}
        {post.instagram_url && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-gray-400">SNS</dt>
            <dd>
              <a
                href={post.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-700 underline underline-offset-2 hover:text-amber-900"
              >
                Instagram
              </a>
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
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
    <article className="space-y-8">
      <ProfileCard post={post} />

      <ReservationButtons post={post} />

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
          [&_img]:mx-auto [&_img]:my-6 [&_img]:max-w-full [&_img]:rounded-2xl
        "
      >
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      <div className="space-y-3 rounded-2xl bg-amber-100/50 p-6 text-center">
        <p className="text-sm font-bold text-gray-900">
          {post.trimmer_name}さん({post.salon_name})にうちの子をお願いしてみませんか?
        </p>
        <ReservationButtons post={post} />
      </div>

      <div>
        <Link href="/" className="text-sm font-medium text-amber-700 hover:text-amber-900">
          ← 他のトリマーさんの記事を見る
        </Link>
      </div>
    </article>
  );
}
