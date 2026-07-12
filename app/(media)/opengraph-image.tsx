import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";
import { loadJapaneseFont, OG_IMAGE_SIZE } from "@/lib/og";

export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";
export const alt = "うちのトリマーさん | 人柄で選ぶ、うちの子のトリマー";

// トップページ用のOGP画像。
export default async function Image() {
  const catchphrase = "人柄で選ぶ、うちの子のトリマー";
  const subText = "東京(世田谷区・杉並区)のトリマー紹介メディア";
  const font = await loadJapaneseFont(SITE_NAME + catchphrase + subText);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fffbeb 0%, #fde68a 100%)",
          fontFamily: "NotoSansJP",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, color: "#78350f" }}>{SITE_NAME}</div>
        <div style={{ fontSize: 40, color: "#92400e", marginTop: 24 }}>{catchphrase}</div>
        <div style={{ fontSize: 26, color: "#b45309", marginTop: 40 }}>{subText}</div>
      </div>
    ),
    {
      ...OG_IMAGE_SIZE,
      fonts: [{ name: "NotoSansJP", data: font, weight: 700, style: "normal" }],
    }
  );
}
