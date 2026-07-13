import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import type { MediaPost } from "@/lib/types";
import LikeButton from "./LikeButton";
import ShareButtons from "./ShareButtons";

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

// 記事本文の見出し(H2/H3)を抜き出して目次を作る。
type Heading = { level: 2 | 3; text: string };

// 見出しテキストから太字・リンクなどの装飾記法を取り除く。
// (本文レンダリング時の見出しIDと一致させるため、表示テキストと同じ形にする)
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .trim();
}

function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  // 記事本文はWindows形式の改行(\r\n)で保存されていることがあるため、\rも含めて区切る。
  for (const line of content.split(/\r?\n/)) {
    const h3 = line.match(/^###\s+(.+)$/);
    const h2 = line.match(/^##\s+(.+)$/);
    if (h3) headings.push({ level: 3, text: stripInlineMarkdown(h3[1]) });
    else if (h2) headings.push({ level: 2, text: stripInlineMarkdown(h2[1]) });
  }
  return headings;
}

// React要素の中身をプレーンテキストに変換する(見出しID生成用)。
function childrenToText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(childrenToText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return childrenToText((node as { props: { children?: React.ReactNode } }).props.children);
  }
  return "";
}

// 見出しにジャンプ用のIDを付けるためのカスタムレンダラー。
const markdownComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 id={childrenToText(children).trim()} className="scroll-mt-4">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 id={childrenToText(children).trim()} className="scroll-mt-4">
      {children}
    </h3>
  ),
};

// 目次。見出しが2つ以上あるときだけ表示する。
function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length < 2) return null;

  return (
    <nav className="rounded-2xl border border-amber-100 bg-white p-5">
      <p className="mb-3 text-sm font-bold text-gray-900">目次</p>
      <ul className="space-y-2 text-sm">
        {headings.map((heading, index) => (
          <li key={`${heading.text}-${index}`} className={heading.level === 3 ? "pl-4" : ""}>
            <a
              href={`#${encodeURIComponent(heading.text)}`}
              className="text-amber-700 hover:text-amber-900 hover:underline"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
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
    return { title: `記事が見つかりません | ${SITE_NAME}` };
  }

  const title = `${post.title} | ${SITE_NAME}`;
  const description = buildDescription(post.content);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: SITE_NAME,
      url: `${SITE_URL}/trimmers/${post.slug}`,
      locale: "ja_JP",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// 検索エンジン向けの構造化データ(記事+店舗情報)。
function StructuredData({ post }: { post: MediaPost }) {
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.published_at,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}/trimmers/${post.slug}`,
  };

  const business = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: post.salon_name,
    ...(post.address && { address: post.address }),
    ...(post.phone_number && { telephone: post.phone_number }),
    ...(post.website_url && { url: post.website_url }),
    ...(post.price_range && { priceRange: post.price_range }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(business) }}
      />
    </>
  );
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
        {post.nearest_station && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-gray-400">最寄り駅</dt>
            <dd>{post.nearest_station}</dd>
          </div>
        )}
        {post.price_range && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-gray-400">料金目安</dt>
            <dd>{post.price_range}</dd>
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
      {post.address && (
        <div className="mt-4 overflow-hidden rounded-xl border border-amber-100">
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(post.address)}&output=embed`}
            title={`${post.salon_name}の地図`}
            className="h-56 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}
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
      <StructuredData post={post} />

      <ProfileCard post={post} />

      <ReservationButtons post={post} />

      <TableOfContents headings={extractHeadings(post.content)} />

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
        <ReactMarkdown components={markdownComponents}>{post.content}</ReactMarkdown>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <LikeButton postId={post.id} initialLikes={post.likes ?? 0} />
        <ShareButtons title={post.title} />
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
