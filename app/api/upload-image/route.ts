import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

// 記事本文に挿入する画像をSupabase Storage(article-imagesバケット)へアップロードする。
// 管理者(ログイン中のユーザー)のみ使用可能。
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ファイルが選択されていません。" }, { status: 400 });
  }

  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "JPEG / PNG / WebP / GIF の画像のみアップロードできます。" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "ファイルサイズは5MB以下にしてください。" },
      { status: 400 }
    );
  }

  const path = `${randomUUID()}.${extension}`;
  const adminSupabase = createAdminSupabaseClient();

  const { error: uploadError } = await adminSupabase.storage
    .from("article-images")
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
    });

  if (uploadError) {
    console.error("[upload-image] アップロード失敗:", uploadError.message);
    return NextResponse.json({ error: "アップロードに失敗しました。" }, { status: 500 });
  }

  const { data } = adminSupabase.storage.from("article-images").getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl });
}
