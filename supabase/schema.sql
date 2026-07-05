-- A.Interview MVP データベーススキーマ
--
-- 使い方: Supabaseダッシュボード > SQL Editor に、このファイルの中身を
-- そのまま貼り付けて「Run」を押すだけでテーブルが作成されます。
-- (Supabase CLI やマイグレーション管理は使わず、このファイル1枚で完結させています)

-- ============================================================
-- 1. projects: 管理者が作成するインタビュー案件
-- ============================================================
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  article_type text not null,
  theme text not null,
  target_reader text not null,
  tone text not null,
  has_photo boolean not null default false,
  word_count int not null,
  share_token text not null unique,
  status text not null default 'draft' check (status in ('draft', 'in_progress', 'completed', 'generated')),
  created_at timestamptz not null default now()
);

create index if not exists projects_owner_id_idx on projects (owner_id);
create index if not exists projects_share_token_idx on projects (share_token);

-- ============================================================
-- 2. interview_sessions: 回答者が回答したセッション
-- ============================================================
create table if not exists interview_sessions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  created_at timestamptz not null default now()
);

create index if not exists interview_sessions_project_id_idx on interview_sessions (project_id);

-- ============================================================
-- 3. interview_messages: AIチャットの会話履歴
-- ============================================================
create table if not exists interview_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references interview_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists interview_messages_session_id_idx on interview_messages (session_id);

-- ============================================================
-- 4. generated_articles: AIが生成した記事(1案件につき1件、再生成は上書き)
-- ============================================================
create table if not exists generated_articles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references projects (id) on delete cascade,
  content text not null,
  generated_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
--
-- 方針: すべての読み書きはNext.jsサーバー経由で行う。
-- - 管理画面(ログイン中の管理者): サーバーコンポーネントがユーザーのセッションで
--   Supabaseへアクセスするため、「自分が作った案件だけ見える」ポリシーを設定する。
-- - 回答者向けAPI: 回答者はログインしていないため、サーバーのAPI Routeが
--   service role key(RLSを無視できる特別な鍵)を使ってアクセスする。
--   そのため、anon/authenticatedキーからのアクセスは基本的に許可しない。
-- ============================================================

alter table projects enable row level security;
alter table interview_sessions enable row level security;
alter table interview_messages enable row level security;
alter table generated_articles enable row level security;

create policy "管理者は自分の案件のみ閲覧可能" on projects
  for select using (auth.uid() = owner_id);

create policy "管理者は自分の案件のみ作成可能" on projects
  for insert with check (auth.uid() = owner_id);

create policy "管理者は自分の案件のみ更新可能" on projects
  for update using (auth.uid() = owner_id);

create policy "管理者は自分の案件のセッションのみ閲覧可能" on interview_sessions
  for select using (
    exists (
      select 1 from projects
      where projects.id = interview_sessions.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "管理者は自分の案件のメッセージのみ閲覧可能" on interview_messages
  for select using (
    exists (
      select 1 from interview_sessions
      join projects on projects.id = interview_sessions.project_id
      where interview_sessions.id = interview_messages.session_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "管理者は自分の案件の記事のみ閲覧可能" on generated_articles
  for select using (
    exists (
      select 1 from projects
      where projects.id = generated_articles.project_id
      and projects.owner_id = auth.uid()
    )
  );

-- interview_sessions / interview_messages / generated_articles への
-- insert/update は、管理画面からは行わない(回答者向けAPIがservice role keyで行う)ため
-- ポリシーを用意していない。これにより、ブラウザから直接これらを書き換えることはできない。
