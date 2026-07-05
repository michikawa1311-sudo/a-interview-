import Link from "next/link";
import { signOut } from "./actions";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="text-lg font-bold text-gray-900">
            A.Interview
          </Link>
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
