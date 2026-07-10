import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function MediaPostsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: posts } = await supabase
    .from("media_posts")
    .select("*")
    .order("published_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">公開記事一覧(うちのトリマーさん)</h1>
        <Link href="/" target="_blank" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          公開サイトを見る →
        </Link>
      </div>

      {!posts || posts.length === 0 ? (
        <p className="text-sm text-gray-500">
          まだ公開記事がありません。案件詳細ページの「メディアに公開」から追加できます。
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {posts.map((post) => (
            <li key={post.id} className="flex items-center justify-between gap-4 px-4 py-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{post.title}</p>
                <p className="text-sm text-gray-500">
                  {post.area} / {post.salon_name} / {post.trimmer_name}さん
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    post.status === "published"
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {post.status === "published" ? "公開中" : "非公開"}
                </span>
                {post.status === "published" && (
                  <Link
                    href={`/trimmers/${post.slug}`}
                    target="_blank"
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    表示
                  </Link>
                )}
                <Link
                  href={`/dashboard/posts/${post.id}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  編集
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
