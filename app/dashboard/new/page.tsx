import { createProject } from "../actions";
import ArticleTypeFields from "./ArticleTypeFields";

export default function NewProjectPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-gray-900">新規インタビュー案件</h1>

      <form action={createProject} className="max-w-lg space-y-5 rounded-lg border border-gray-200 bg-white p-6">
        <ArticleTypeFields />

        <div>
          <label htmlFor="target_reader" className="mb-1 block text-sm font-medium text-gray-700">
            読者ターゲット
          </label>
          <input
            id="target_reader"
            name="target_reader"
            required
            placeholder="例: 20代〜30代の女性、カフェ巡りが好きな人"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="tone" className="mb-1 block text-sm font-medium text-gray-700">
            トーン
          </label>
          <input
            id="tone"
            name="tone"
            required
            placeholder="例: 親しみやすく丁寧、カジュアル 等"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="word_count" className="mb-1 block text-sm font-medium text-gray-700">
            目標文字数
          </label>
          <input
            id="word_count"
            name="word_count"
            type="number"
            min={100}
            step={100}
            required
            placeholder="例: 1500"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="has_photo"
            name="has_photo"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
          />
          <label htmlFor="has_photo" className="text-sm font-medium text-gray-700">
            写真あり(記事内に写真キャプション欄を含める)
          </label>
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          作成してインタビューリンクを発行
        </button>
      </form>
    </div>
  );
}
