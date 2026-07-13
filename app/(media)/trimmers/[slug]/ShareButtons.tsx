"use client";

import { useState } from "react";

export default function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  function pageUrl() {
    return window.location.href;
  }

  function shareOnX() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(pageUrl())}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function shareOnLine() {
    const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(pageUrl())}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(pageUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const buttonClass =
    "rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition hover:border-amber-300 hover:text-amber-700";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-400">シェア:</span>
      <button type="button" onClick={shareOnX} className={buttonClass}>
        X(旧Twitter)
      </button>
      <button type="button" onClick={shareOnLine} className={buttonClass}>
        LINE
      </button>
      <button type="button" onClick={copyLink} className={buttonClass}>
        {copied ? "コピーしました!" : "リンクをコピー"}
      </button>
    </div>
  );
}
