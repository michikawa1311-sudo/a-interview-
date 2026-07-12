import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// 記事への「いいね」を1件追加する。ログイン不要(匿名)。
// 連打の防止はクライアント側(localStorage)で行う簡易な仕組みとし、
// 厳密な重複排除はこの規模では行わない。
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminSupabaseClient();

  const { data: post } = await supabase
    .from("media_posts")
    .select("id, likes")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ error: "記事が見つかりません。" }, { status: 404 });
  }

  const newLikes = (post.likes ?? 0) + 1;

  const { error } = await supabase
    .from("media_posts")
    .update({ likes: newLikes })
    .eq("id", id);

  if (error) {
    console.error("[like] 更新失敗:", error.message);
    return NextResponse.json({ error: "いいねに失敗しました。" }, { status: 500 });
  }

  return NextResponse.json({ likes: newLikes });
}
