"use client";

import { useState } from "react";

export default function ToggleStatusButton({
  isPublished,
  toggleAction,
}: {
  isPublished: boolean;
  toggleAction: () => Promise<void>;
}) {
  const [isToggling, setIsToggling] = useState(false);

  async function handleToggle() {
    if (isPublished) {
      const confirmed = window.confirm("この記事を非公開にします。よろしいですか?");
      if (!confirmed) return;
    }

    setIsToggling(true);
    try {
      await toggleAction();
    } finally {
      setIsToggling(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isToggling}
      className={`rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
        isPublished
          ? "border border-gray-300 text-gray-600 hover:bg-gray-50"
          : "bg-green-600 text-white hover:bg-green-500"
      }`}
    >
      {isToggling ? "変更中..." : isPublished ? "非公開にする" : "公開する"}
    </button>
  );
}
