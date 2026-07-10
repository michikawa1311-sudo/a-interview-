"use client";

const AREAS = ["世田谷区", "杉並区"];

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none";

type Defaults = {
  slug?: string;
  title?: string;
  trimmer_name?: string;
  salon_name?: string;
  area?: string;
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
            ウェブサイト・予約ページURL(任意)
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
        <label htmlFor="content" className="mb-1 block text-sm font-medium text-gray-700">
          記事本文(Markdown) *
        </label>
        <textarea
          id="content"
          name="content"
          required
          rows={16}
          defaultValue={defaults.content ?? ""}
          className={`${inputClass} font-mono`}
        />
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
