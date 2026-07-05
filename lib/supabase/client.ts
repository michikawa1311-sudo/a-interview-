import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types";

// ブラウザ(クライアントコンポーネント)から使うSupabaseクライアント。
// ログインフォームなど、ユーザー操作に直接反応する画面でのみ使用する。
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
