"use client";

import { useEffect } from "react";

const STORAGE_KEY = "uchino-trimmer-viewed";

function getViewedPosts(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

// 記事ページを開いたことを1回だけ記録する(同じタブ内での再読み込みは数えない)。
export default function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    const viewed = getViewedPosts();
    if (viewed.includes(postId)) return;

    fetch(`/api/posts/${postId}/view`, { method: "POST" }).catch(() => {});

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...viewed, postId]));
    } catch {
      // sessionStorageが使えない環境では記録しない(閲覧数の反映自体は済んでいる)
    }
  }, [postId]);

  return null;
}
