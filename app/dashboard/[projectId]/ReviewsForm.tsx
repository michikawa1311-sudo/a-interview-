"use client";

import { useState } from "react";
import { saveProjectReviews } from "../actions";

export default function ReviewsForm({
  projectId,
  defaultValue,
}: {
  projectId: string;
  defaultValue: string;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const action = saveProjectReviews.bind(null, projectId);

  return (
    <form
      action={async (formData) => {
        setIsSaving(true);
        setSaved(false);
        await action(formData);
        setIsSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }}
      className="space-y-2"
    >
      <textarea
        name="reviews"
        rows={5}
        defaultValue={defaultValue}
        placeholder={"例:\n「毛質に合わせて丁寧にカットしてもらえました。愛犬もリラックスしていました」\n「スタッフさんが優しく、初めてでも安心して預けられました」"}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          {isSaving ? "保存中..." : "口コミを保存"}
        </button>
        {saved && <span className="text-xs text-green-600">保存しました</span>}
      </div>
    </form>
  );
}
