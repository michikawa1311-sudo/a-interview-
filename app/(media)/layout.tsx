import Link from "next/link";
import { CONTACT_EMAIL, CONTACT_INSTAGRAM_URL, MEDIA_AREAS } from "@/lib/site";

// 公開メディア「うちのトリマーさん」の共通レイアウト(ヘッダー・フッター)。
// 管理画面(A.Interview)とは別ブランドのため、温かみのあるアンバー系の配色にしている。
export default function MediaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-amber-50/40">
      <header className="border-b border-amber-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-amber-900">
            <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="#d97706" aria-hidden="true">
              <ellipse cx="12" cy="15.5" rx="5" ry="4.5" />
              <circle cx="6" cy="10" r="2.4" />
              <circle cx="10" cy="7" r="2.4" />
              <circle cx="14" cy="7" r="2.4" />
              <circle cx="18" cy="10" r="2.4" />
            </svg>
            うちのトリマーさん
          </Link>
          <p className="hidden text-xs text-amber-700 sm:block">
            人柄で選ぶ、うちの子のトリマー
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">{children}</main>

      <footer className="border-t border-amber-100 bg-white">
        <div className="mx-auto max-w-3xl space-y-3 px-4 py-8 text-center text-xs text-gray-400">
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {MEDIA_AREAS.map((area) => (
              <Link
                key={area.slug}
                href={`/area/${area.slug}`}
                className="hover:text-amber-700"
              >
                {area.name}のトリマーさん
              </Link>
            ))}
            <Link href="/map" className="hover:text-amber-700">
              地図から探す
            </Link>
            <Link href="/about" className="hover:text-amber-700">
              このサイトについて
            </Link>
          </nav>
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-amber-700">
              {CONTACT_EMAIL}
            </a>
            <a
              href={CONTACT_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amber-700"
            >
              Instagram
            </a>
          </p>
          <p>うちのトリマーさん — 東京(世田谷区・杉並区)のトリマーを人柄で紹介するメディア</p>
        </div>
      </footer>
    </div>
  );
}
