"use client";

import type { MediaPost } from "@/lib/types";

// クリック計測はページ遷移(tel:や外部サイトへのジャンプ)を邪魔しないよう、
// レスポンスを待たない sendBeacon で送る(未対応ブラウザは fetch + keepalive にフォールバック)。
function recordClick(postId: string, type: "phone" | "website") {
  const url = `/api/posts/${postId}/click`;
  const body = JSON.stringify({ type });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    return;
  }

  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(
    () => {}
  );
}

// 電話・公式サイトの予約ボタン。どちらも未設定の場合は何も表示しない。
export default function ReservationButtons({ post }: { post: MediaPost }) {
  if (!post.phone_number && !post.website_url) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {post.phone_number && (
        <a
          href={`tel:${post.phone_number.replace(/[^\d+]/g, "")}`}
          onClick={() => recordClick(post.id, "phone")}
          className="flex-1 rounded-full bg-amber-600 px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-amber-700"
        >
          電話で予約する({post.phone_number})
        </a>
      )}
      {post.website_url && (
        <a
          href={post.website_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => recordClick(post.id, "website")}
          className="flex-1 rounded-full border-2 border-amber-600 bg-white px-6 py-3 text-center text-sm font-bold text-amber-700 transition hover:bg-amber-50"
        >
          公式サイトで予約する
        </a>
      )}
    </div>
  );
}
