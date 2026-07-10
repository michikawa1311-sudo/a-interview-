"use client";

import { useState } from "react";

export default function DeletePostButton({
  deleteAction,
}: {
  deleteAction: () => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "この記事を公開サイトから削除します。元に戻せません。よろしいですか?"
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteAction();
    } catch {
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {isDeleting ? "削除中..." : "この記事を削除"}
    </button>
  );
}
