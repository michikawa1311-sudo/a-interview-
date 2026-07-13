import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import type { MediaPost } from "@/lib/types";

const TOP_TITLE = `${SITE_NAME} | 人柄で選ぶ、東京のトリマー紹介メディア`;

export const metadata: Metadata = {
  title: TOP_TITLE,
  description: SITE_DESCRIPTION,
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

function PostCard({ post }: { post: MediaPost }) {
  // 複数の最寄り駅は「 / 」区切りで保存されているため、一番近い駅(先頭)だけを表示する。
  const nearestStation = post.nearest_station?.split("/")[0]?.trim();

  return (
    <Link
      href={`/trimmers/${post.slug}`}
      className="block rounded-xl border border-amber-100 bg-white p-5 transition hover:border-amber-300 hover:shadow-sm"
    >
      <div className="flex items-start gap-4">
        {post.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.photo_url}
            alt={`${post.trimmer_name}さんの顔写真`}
            className="h-16 w-16 shrink-0 rounded-full border border-amber-100 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amber-100 text-2xl">
            🐶
          </div>
        )}
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium text-amber-700">
            {post.area} / {post.salon_name}
          </p>
          <h3 className="mb-2 font-bold text-gray-900">{post.title}</h3>
          <p className="text-sm text-gray-500">{post.trimmer_name}さん</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
            {nearestStation && <span>最寄り駅: {nearestStation}</span>}
            <span className="text-rose-400">♥ {post.likes ?? 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default async function MediaTopPage() {
  const supabase = await createServerSupabaseClient();
  const { data: posts } = await supabase
    .from("media_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const allPosts = posts ?? [];
  const areas = ["世田谷区", "杉並区"];

  return (
    <div className="space-y-12">
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
        areas.map((area) => {
          const areaPosts = allPosts.filter((p) => p.area === area);
          if (areaPosts.length === 0) return null;
          return (
            <section key={area}>
              <h2 className="mb-4 border-b border-amber-200 pb-2 text-lg font-bold text-gray-900">
                {area}のトリマーさん
              </h2>
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
