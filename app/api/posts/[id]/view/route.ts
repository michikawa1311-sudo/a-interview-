import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// 記事の閲覧数を1件加算する。ログイン不要(匿名)。
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminSupabaseClient();

  const { data: post } = await supabase
    .from("media_posts")
    .select("id, view_count")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ error: "記事が見つかりません。" }, { status: 404 });
  }

  await supabase
    .from("media_posts")
    .update({ view_count: (post.view_count ?? 0) + 1 })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
