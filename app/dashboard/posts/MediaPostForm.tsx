"use client";

import { useRef, useState } from "react";

const AREAS = ["世田谷区", "杉並区"];

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none";

type Defaults = {
  slug?: string;
  title?: string;
  trimmer_name?: string;
  salon_name?: string;
  area?: string;
  address?: string | null;
  phone_number?: string | null;
  tagline?: string | null;
  price_range?: string | null;
  instagram_url?: string | null;
  website_url?: string | null;
  content?: string;
  status?: "draft" | "published";
};

export default function MediaPostForm({
  action,
  defaults = {},
  projectId,
  submitLabel,
  showStatus = false,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults?: Defaults;
  projectId?: string;
  submitLabel: string;
  showStatus?: boolean;
}) {
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 画像をアップロードし、本文テキストエリアのカーソル位置にMarkdownの画像記法を挿入する。
  async function handleImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 同じファイルを続けて選択できるようにリセット
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload-image", { method: "POST", body: formData });

    setIsUploading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setUploadError(data?.error ?? "アップロードに失敗しました。");
      return;
    }

    const data = await res.json();
    const markdown = `\n![写真](${data.url})\n`;

    const el = contentRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    el.value = el.value.slice(0, start) + markdown + el.value.slice(end);
    const cursor = start + markdown.length;
    el.setSelectionRange(cursor, cursor);
    el.focus();
  }

  return (
    <form action={action} className="space-y-4">
      {projectId && <input type="hidden" name="project_id" value={projectId} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="trimmer_name" className="mb-1 block text-sm font-medium text-gray-700">
            トリマーのお名前 *
          </label>
          <input
            id="trimmer_name"
            name="trimmer_name"
            required
            defaultValue={defaults.trimmer_name ?? ""}
            placeholder="例: 田中 花子"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="salon_name" className="mb-1 block text-sm font-medium text-gray-700">
            サロン名 *
          </label>
          <input
            id="salon_name"
            name="salon_name"
            required
            defaultValue={defaults.salon_name ?? ""}
            placeholder="例: DogSalon はなまる"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="area" className="mb-1 block text-sm font-medium text-gray-700">
            エリア *
          </label>
          <select
            id="area"
            name="area"
            required
            defaultValue={defaults.area ?? AREAS[0]}
            className={inputClass}
          >
            {AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="slug" className="mb-1 block text-sm font-medium text-gray-700">
            URL用の文字列(半角英数字とハイフン) *
          </label>
          <input
            id="slug"
            name="slug"
            required
            pattern="[a-z0-9\-]+"
            defaultValue={defaults.slug ?? ""}
            placeholder="例: hanamaru-tanaka"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-400">
            記事のURLになります(例: /trimmers/hanamaru-tanaka)。公開後の変更は避けてください。
          </p>
        </div>

        <div>
          <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">
            住所(任意)
          </label>
          <input
            id="address"
            name="address"
            defaultValue={defaults.address ?? ""}
            placeholder="例: 東京都世田谷区○○ 1-2-3"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="phone_number" className="mb-1 block text-sm font-medium text-gray-700">
            電話番号(任意・電話予約ボタンに使用)
          </label>
          <input
            id="phone_number"
            name="phone_number"
            defaultValue={defaults.phone_number ?? ""}
            placeholder="例: 03-1234-5678"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="price_range" className="mb-1 block text-sm font-medium text-gray-700">
            料金の目安(任意・プロフィールに表示)
          </label>
          <input
            id="price_range"
            name="price_range"
            defaultValue={defaults.price_range ?? ""}
            placeholder="例: 小型犬カット 6,000円〜"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="tagline" className="mb-1 block text-sm font-medium text-gray-700">
          一言(任意・プロフィールに表示)
        </label>
        <input
          id="tagline"
          name="tagline"
          defaultValue={defaults.tagline ?? ""}
          placeholder="例: わんちゃんのペースに合わせた優しいトリミングを心がけています"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
          記事タイトル *
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaults.title ?? ""}
          placeholder="例: 「トリミングは会話から」DogSalonはなまる 田中さんのこだわり"
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="instagram_url" className="mb-1 block text-sm font-medium text-gray-700">
            Instagram URL(任意)
          </label>
          <input
            id="instagram_url"
            name="instagram_url"
            type="url"
            defaultValue={defaults.instagram_url ?? ""}
            placeholder="https://www.instagram.com/..."
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="website_url" className="mb-1 block text-sm font-medium text-gray-700">
            ウェブサイト・予約ページURL(任意・予約ボタンに使用)
          </label>
          <input
            id="website_url"
            name="website_url"
            type="url"
            defaultValue={defaults.website_url ?? ""}
            placeholder="https://..."
            className={inputClass}
          />
        </div>
      </div>

      {showStatus && (
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
            公開状態
          </label>
          <select
            id="status"
            name="status"
            defaultValue={defaults.status ?? "published"}
            className={inputClass}
          >
            <option value="published">公開</option>
            <option value="draft">非公開(下書き)</option>
          </select>
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            記事本文(Markdown) *
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            {isUploading ? "アップロード中..." : "写真を追加(カーソル位置に挿入)"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageSelected}
            className="hidden"
          />
        </div>
        {uploadError && <p className="mb-2 text-sm text-red-600">{uploadError}</p>}
        <textarea
          ref={contentRef}
          id="content"
          name="content"
          required
          rows={16}
          defaultValue={defaults.content ?? ""}
          className={`${inputClass} font-mono`}
        />
        <p className="mt-1 text-xs text-gray-400">
          写真は「写真を追加」ボタンでアップロードすると、本文のカーソル位置に自動で挿入されます。
        </p>
      </div>

      <button
        type="submit"
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        {submitLabel}
      </button>
    </form>
  );
}
