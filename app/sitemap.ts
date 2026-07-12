import type { MetadataRoute } from "next";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";

// 検索エンジンに公開ページの一覧を伝えるサイトマップ。
// 訪問者のCookieに依存しないよう、公開済み記事の取得にはadminクライアントを使う。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminSupabaseClient();
  const { data: posts } = await supabase
    .from("media_posts")
    .select("slug, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const articleEntries: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${SITE_URL}/trimmers/${post.slug}`,
    lastModified: new Date(post.published_at),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...articleEntries,
  ];
}
