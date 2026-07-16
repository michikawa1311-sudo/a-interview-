import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

// 予約ボタン(電話/公式サイト)のクリック数を1件加算する。ログイン不要(匿名)。
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const type = body?.type;

  if (type !== "phone" && type !== "website") {
    return NextResponse.json({ error: "不正なリクエストです。" }, { status: 400 });
  }

  const supabase = createAdminSupabaseClient();

  const { data: post } = await supabase
    .from("media_posts")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!post) {
    return NextResponse.json({ error: "記事が見つかりません。" }, { status: 404 });
  }

  const update =
    type === "phone"
      ? { phone_click_count: post.phone_click_count + 1 }
      : { website_click_count: post.website_click_count + 1 };

  await supabase.from("media_posts").update(update).eq("id", id);

  return NextResponse.json({ ok: true });
}
