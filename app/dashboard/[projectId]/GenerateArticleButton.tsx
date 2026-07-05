"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GenerateArticleButton({
  projectId,
  hasExistingArticle,
}: {
  projectId: string;
  hasExistingArticle: boolean;
}) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    const res = await fetch(`/api/projects/${projectId}/generate`, {
      method: "POST",
    });

    setIsGenerating(false);

    if (!res.ok) {
      setError("記事の生成に失敗しました。もう一度お試しください。");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {isGenerating
          ? "生成中..."
          : hasExistingArticle
            ? "記事を再生成"
            : "記事を生成"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
