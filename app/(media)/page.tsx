import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MEDIA_AREAS, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import PostCard from "./PostCard";

const TOP_TITLE = `${SITE_NAME} | 人柄で選ぶ、東京のトリマー紹介メディア`;

export const metadata: Metadata = {
  title: TOP_TITLE,
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: TOP_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: TOP_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default async function MediaTopPage() {
  const supabase = await createServerSupabaseClient();
  const { data: posts } = await supabase
    .from("media_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const allPosts = posts ?? [];

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  };

  return (
    <div className="space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <section className="text-center">
        <h1 className="mb-3 text-2xl font-bold text-gray-900 sm:text-3xl">
          人柄で選ぶ、うちの子のトリマー
        </h1>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-gray-600">
          料金や場所だけでは分からない、トリマーさんの想いとこだわり。
          大切な家族を任せられる人に出会えるように、世田谷区・杉並区のトリマーさんを一人ずつ丁寧に紹介します。
        </p>
      </section>

      {allPosts.length === 0 ? (
        <p className="text-center text-sm text-gray-500">
          記事を準備中です。もうしばらくお待ちください。
        </p>
      ) : (
        MEDIA_AREAS.map((area) => {
          const areaPosts = allPosts.filter((p) => p.area === area.name);
          if (areaPosts.length === 0) return null;
          return (
            <section key={area.name}>
              <div className="mb-4 flex items-center justify-between border-b border-amber-200 pb-2">
                <h2 className="text-lg font-bold text-gray-900">{area.name}のトリマーさん</h2>
                <Link
                  href={`/area/${area.slug}`}
                  className="text-sm font-medium text-amber-700 hover:text-amber-900"
                >
                  {area.name}の一覧へ →
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {areaPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
