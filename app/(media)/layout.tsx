import Link from "next/link";

// 公開メディア「うちのトリマーさん」の共通レイアウト(ヘッダー・フッター)。
// 管理画面(A.Interview)とは別ブランドのため、温かみのあるアンバー系の配色にしている。
export default function MediaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-amber-50/40">
      <header className="border-b border-amber-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
          <Link href="/" className="text-xl font-bold text-amber-900">
            うちのトリマーさん
          </Link>
          <p className="hidden text-xs text-amber-700 sm:block">
            人柄で選ぶ、うちの子のトリマー
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">{children}</main>

      <footer className="border-t border-amber-100 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8 text-center text-xs text-gray-400">
          <p>うちのトリマーさん — 東京(世田谷区・杉並区)のトリマーを人柄で紹介するメディア</p>
        </div>
      </footer>
    </div>
  );
}
