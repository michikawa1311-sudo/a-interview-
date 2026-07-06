"use client";

import { useState } from "react";

const ARTICLE_TYPES = ["店舗紹介", "個人インタビュー", "ブログ"] as const;

const THEME_FIELD_CONFIG: Record<(typeof ARTICLE_TYPES)[number], { label: string; placeholder: string }> = {
  店舗紹介: { label: "店舗名", placeholder: "例: ○○カフェ 渋谷店" },
  個人インタビュー: { label: "お名前", placeholder: "例: 山田 太郎" },
  ブログ: { label: "テーマ", placeholder: "例: 初心者向けの家庭菜園の始め方" },
};

export default function ArticleTypeFields() {
  const [articleType, setArticleType] = useState<(typeof ARTICLE_TYPES)[number]>(ARTICLE_TYPES[0]);
  const themeField = THEME_FIELD_CONFIG[articleType];

  return (
    <>
      <div>
        <label htmlFor="article_type" className="mb-1 block text-sm font-medium text-gray-700">
          記事タイプ
        </label>
        <select
          id="article_type"
          name="article_type"
          required
          value={articleType}
          onChange={(e) => setArticleType(e.target.value as (typeof ARTICLE_TYPES)[number])}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          {ARTICLE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="theme" className="mb-1 block text-sm font-medium text-gray-700">
          {themeField.label}
        </label>
        <input
          id="theme"
          name="theme"
          required
          placeholder={themeField.placeholder}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>
    </>
  );
}
