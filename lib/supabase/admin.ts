import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

// service role key を使う管理者権限クライアント。RLSを完全にバイパスするため、
// 必ずサーバー側(API Route)からのみ使用し、ブラウザに公開してはいけない。
//
// 回答者向けAPI(/api/interview/[token]/chat など)は回答者がログインしていないため、
// このクライアントでDBの読み書きを行う。
export function createAdminSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
