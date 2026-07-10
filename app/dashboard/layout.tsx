import Link from "next/link";
import { signOut } from "./actions";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-bold text-gray-900">
              A.Interview
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-gray-500">
              <Link href="/dashboard" className="hover:text-gray-900">
                案件一覧
              </Link>
              <Link href="/dashboard/posts" className="hover:text-gray-900">
                公開記事
              </Link>
            </nav>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              ログアウト
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
