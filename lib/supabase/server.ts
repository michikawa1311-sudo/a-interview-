import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types";

// サーバーコンポーネント / Server Action から使うSupabaseクライアント。
// ログイン中の管理者のCookie(セッション)を引き継ぐので、RLSは
// 「owner_id = auth.uid()」の条件で自動的に絞り込まれる。
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Componentからの呼び出し時はCookie書き込みができないため無視する。
            // (セッションのリフレッシュはmiddlewareが担当する)
          }
        },
      },
    }
  );
}
