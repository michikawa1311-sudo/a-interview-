// 公開メディア「うちのトリマーさん」のサイト共通設定。

// 独自ドメインを取得したら NEXT_PUBLIC_SITE_URL 環境変数を設定するだけで全体に反映される。
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://a-interview-henna.vercel.app";

export const SITE_NAME = "うちのトリマーさん";

export const SITE_DESCRIPTION =
  "世田谷区・杉並区のトリマーさんを、料金や場所ではなく「人柄とこだわり」で紹介するメディアです。大切なうちの子を任せられるトリマーさんに出会えます。";

// いいね数がこの値未満の間は数字を表示しない(少ない数字が並ぶと閑散として見えるため)。
export const LIKES_DISPLAY_THRESHOLD = 10;
