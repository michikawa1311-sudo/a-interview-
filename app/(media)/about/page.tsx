import type { Metadata } from "next";
import Link from "next/link";
import { MEDIA_AREAS, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE_NAME}について | このサイトの考え方`,
  description: `${SITE_NAME}は、トリマーさんへのインタビューをもとに「人柄とこだわり」を紹介するメディアです。記事の作り方と運営方針をご紹介します。`,
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <section>
        <h1 className="mb-4 text-2xl font-bold text-gray-900">{SITE_NAME}について</h1>
        <p className="text-sm leading-relaxed text-gray-600">
          {SITE_NAME}
          は、東京(世田谷区・杉並区)のトリマーさんを「人柄とこだわり」で紹介するメディアです。
          料金や場所の比較だけでは分からない、「この人になら、うちの子を安心して任せられる」という出会いをお手伝いします。
        </p>
      </section>

      <section>
        <h2 className="mb-3 border-b border-amber-200 pb-2 text-lg font-bold text-gray-900">
          記事の作り方
        </h2>
        <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-gray-600">
          <li>すべての記事は、トリマーさんご本人への実際のインタビューをもとに作成しています。</li>
          <li>掲載前に、トリマーさんご本人に内容を確認していただいています。</li>
          <li>営業時間・料金などの情報は取材時点のものです。最新の情報は各店舗の公式サイト・SNSをご確認ください。</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 border-b border-amber-200 pb-2 text-lg font-bold text-gray-900">
          エリアから探す
        </h2>
        <ul className="space-y-2 text-sm">
          {MEDIA_AREAS.map((area) => (
            <li key={area.slug}>
              <Link
                href={`/area/${area.slug}`}
                className="text-amber-700 underline underline-offset-2 hover:text-amber-900"
              >
                {area.name}のトリマー・トリミングサロン一覧
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 border-b border-amber-200 pb-2 text-lg font-bold text-gray-900">
          掲載をご希望のトリマーさんへ
        </h2>
        <p className="text-sm leading-relaxed text-gray-600">
          {SITE_NAME}
          では、掲載を希望されるトリマーさん・トリミングサロンを募集しています。インタビューはチャット形式で、お好きな時間に回答いただけます。ご興味のある方は、当サイトからご案内を受け取った担当者までご連絡ください。
        </p>
      </section>

      <div>
        <Link href="/" className="text-sm font-medium text-amber-700 hover:text-amber-900">
          ← トップページへ戻る
        </Link>
      </div>
    </div>
  );
}
