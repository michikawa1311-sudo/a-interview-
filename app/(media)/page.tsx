import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { MediaPost } from "@/lib/types";

export const metadata: Metadata = {
  title: "うちのトリマーさん | 人柄で選ぶ、東京のトリマー紹介メディア",
  description:
    "世田谷区・杉並区のトリマーさんを、料金や場所ではなく「人柄とこだわり」で紹介するメディアです。大切なうちの子を任せられるトリマーさんに出会えます。",
};

function PostCard({ post }: { post: MediaPost }) {
  return (
    <Link
      href={`/trimmers/${post.slug}`}
      className="block rounded-xl border border-amber-100 bg-white p-5 transition hover:border-amber-300 hover:shadow-sm"
    >
      <p className="mb-1 text-xs font-medium text-amber-700">
        {post.area} / {post.salon_name}
      </p>
      <h3 className="mb-2 font-bold text-gray-900">{post.title}</h3>
      <p className="text-sm text-gray-500">{post.trimmer_name}さん</p>
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
