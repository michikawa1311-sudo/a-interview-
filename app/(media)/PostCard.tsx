import Link from "next/link";
import type { MediaPost } from "@/lib/types";

// トップページ・エリアページで共通の記事カード。
export default function PostCard({ post }: { post: MediaPost }) {
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
