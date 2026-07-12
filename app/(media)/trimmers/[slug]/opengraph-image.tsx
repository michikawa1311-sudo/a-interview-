import { ImageResponse } from "next/og";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { SITE_NAME } from "@/lib/site";
import { loadJapaneseFont, OG_IMAGE_SIZE } from "@/lib/og";

export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";
export const alt = "記事のサムネイル";

// 記事ごとのOGP画像。記事タイトルとトリマー名を大きく表示する。
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = createAdminSupabaseClient();
  const { data: post } = await supabase
    .from("media_posts")
    .select("title, trimmer_name, salon_name, area")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  const title = post?.title ?? SITE_NAME;
  const subtitle = post ? `${post.area} / ${post.salon_name} / ${post.trimmer_name}さん` : "";
  const font = await loadJapaneseFont(title + subtitle + SITE_NAME);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #fffbeb 0%, #fde68a 100%)",
          padding: 64,
          fontFamily: "NotoSansJP",
        }}
      >
        <div
          style={{
            fontSize: 54,
            fontWeight: 700,
            color: "#1f2937",
            lineHeight: 1.4,
            display: "flex",
          }}
        >
          {title}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div style={{ fontSize: 28, color: "#92400e" }}>{subtitle}</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#78350f" }}>{SITE_NAME}</div>
        </div>
      </div>
    ),
    {
      ...OG_IMAGE_SIZE,
      fonts: [{ name: "NotoSansJP", data: font, weight: 700, style: "normal" }],
    }
  );
}
