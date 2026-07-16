import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import MapClient from "./MapClient";

const TITLE = `地図から探す | ${SITE_NAME}`;
const DESCRIPTION = "世田谷区・杉並区のトリマーさんを地図から探せます。現在地や住所・最寄り駅の検索にも対応しています。";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/map` },
};

export default async function MapPage() {
  const supabase = await createServerSupabaseClient();
  const { data: posts } = await supabase
    .from("media_posts")
    .select("*")
    .eq("status", "published")
    .not("lat", "is", null)
    .not("lng", "is", null);

  const mapPosts = (posts ?? [])
    .filter((post) => post.lat !== null && post.lng !== null)
    .map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      trimmer_name: post.trimmer_name,
      salon_name: post.salon_name,
      area: post.area,
      nearest_station: post.nearest_station,
      photo_url: post.photo_url,
      lat: post.lat as number,
      lng: post.lng as number,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">地図から探す</h1>
        <p className="text-sm leading-relaxed text-gray-600">
          現在地や、住所・最寄り駅のキーワードで検索すると、近いトリマーさんから順に表示されます。
        </p>
      </div>

      {mapPosts.length === 0 ? (
        <p className="text-sm text-gray-500">
          地図に表示できる記事がまだありません。もうしばらくお待ちください。
        </p>
      ) : (
        <MapClient posts={mapPosts} />
      )}
    </div>
  );
}
