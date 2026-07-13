"use client";

import { useEffect, useState } from "react";
import { LIKES_DISPLAY_THRESHOLD } from "@/lib/site";

const STORAGE_KEY = "uchino-trimmer-liked";

function getLikedPosts(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export default function LikeButton({
  postId,
  initialLikes,
}: {
  postId: string;
  initialLikes: number;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // 一度いいねした記事はlocalStorageに記録し、再訪時もボタンを押せないようにする。
  // (サーバー側描画とのずれを防ぐため、描画後の次フレームで反映する)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setLiked(getLikedPosts().includes(postId));
    });
    return () => cancelAnimationFrame(frame);
  }, [postId]);

  async function handleLike() {
    if (liked || isSending) return;

    setIsSending(true);
    const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    setIsSending(false);

    if (!res.ok) return;

    const data = await res.json();
    setLikes(data.likes ?? likes + 1);
    setLiked(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...getLikedPosts(), postId]));
    } catch {
      // localStorageが使えない環境では記録しない(いいね自体は反映済み)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={liked || isSending}
      className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition ${
        liked
          ? "border-rose-200 bg-rose-50 text-rose-500"
          : "border-gray-200 bg-white text-gray-600 hover:border-rose-200 hover:text-rose-500"
      }`}
    >
      <span aria-hidden>{liked ? "♥" : "♡"}</span>
      {liked ? "いいねしました" : "この記事にいいね"}
      {likes >= LIKES_DISPLAY_THRESHOLD && (
        <span className="font-bold">{likes}</span>
      )}
    </button>
  );
}
