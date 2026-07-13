import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// 事前アンケートで回答者が顔写真をアップロードするためのAPI。
// 回答者はログインしていないため、有効なインタビュートークンを持っていることを確認して受け付ける。
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createAdminSupabaseClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("share_token", token)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: "リンクが見つかりません。" }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "ファイルが選択されていません。" }, { status: 400 });
  }

  const extension = EXTENSION_BY_MIME[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "JPEG / PNG / WebP の画像のみアップロードできます。" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "ファイルサイズは5MB以下にしてください。" },
      { status: 400 }
    );
  }

  const path = `profiles/${randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("article-images")
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
    });

  if (uploadError) {
    console.error("[interview photo] アップロード失敗:", uploadError.message);
    return NextResponse.json({ error: "アップロードに失敗しました。" }, { status: 500 });
  }

  const { data } = supabase.storage.from("article-images").getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl });
}
