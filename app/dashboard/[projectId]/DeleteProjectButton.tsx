"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProject } from "../actions";

export default function DeleteProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      "この案件を削除します。回答内容や生成記事もすべて削除され、元に戻せません。よろしいですか?"
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteProject(projectId);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("削除に失敗しました。もう一度お試しください。");
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {isDeleting ? "削除中..." : "この案件を削除"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
