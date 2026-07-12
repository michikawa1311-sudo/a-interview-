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
  progress int not null default 0,
  profile jsonb,
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

create policy "管理者は自分の案件のみ削除可能" on projects
  for delete using (auth.uid() = owner_id);

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

-- ============================================================
-- 追記マイグレーション: interview_sessions に progress 列を追加(進捗バー表示のため)
--
-- すでにテーブルを作成済みの環境では、このファイルを最初から再実行すると
-- 「create policy」の部分でエラーになるため、下の1文だけをSQL Editorで実行してください。
-- (新規にこのファイルを実行する場合は上のcreate table文に含まれているため不要です)
-- ============================================================
alter table interview_sessions add column if not exists progress int not null default 0;

-- ============================================================
-- 追記マイグレーション: projects に削除ポリシーを追加(案件削除機能のため)
--
-- 上と同じ理由で、下の1文だけをSQL Editorで実行してください。
-- ============================================================
create policy "管理者は自分の案件のみ削除可能" on projects
  for delete using (auth.uid() = owner_id);

-- ============================================================
-- 追記マイグレーション: media_posts テーブルを追加
-- (公開メディア「うちのトリマーさん」に掲載する記事)
--
-- すでにテーブルを作成済みの環境では、この下のブロック全体だけを
-- SQL Editorで実行してください。
--
-- 生成記事(generated_articles)は再生成で上書きされるため、
-- 公開時に本文をこのテーブルへコピーして固定する。公開後の修正はこちらを編集する。
-- ============================================================
create table if not exists media_posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references projects (id) on delete set null,
  slug text not null unique,
  title text not null,
  trimmer_name text not null,
  salon_name text not null,
  area text not null,
  address text,
  phone_number text,
  tagline text,
  price_range text,
  likes int not null default 0,
  instagram_url text,
  website_url text,
  content text not null,
  status text not null default 'published' check (status in ('draft', 'published')),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists media_posts_slug_idx on media_posts (slug);
create index if not exists media_posts_area_idx on media_posts (area);

alter table media_posts enable row level security;

create policy "公開済み記事は誰でも閲覧可能" on media_posts
  for select using (status = 'published' or auth.uid() = owner_id);

create policy "管理者は自分の記事のみ作成可能" on media_posts
  for insert with check (auth.uid() = owner_id);

create policy "管理者は自分の記事のみ更新可能" on media_posts
  for update using (auth.uid() = owner_id);

create policy "管理者は自分の記事のみ削除可能" on media_posts
  for delete using (auth.uid() = owner_id);

-- ============================================================
-- 追記マイグレーション: 事前アンケートと記事プロフィール用の列を追加
--
-- すでにテーブルを作成済みの環境では、下の4文だけをSQL Editorで実行してください。
-- - interview_sessions.profile: インタビュー前の基本情報アンケートの回答(JSON)
-- - media_posts.address / phone_number / tagline: 記事上部のプロフィールカードと予約ボタンに使用
-- ============================================================
alter table interview_sessions add column if not exists profile jsonb;
alter table media_posts add column if not exists address text;
alter table media_posts add column if not exists phone_number text;
alter table media_posts add column if not exists tagline text;

-- 補足: 記事本文の写真は Supabase Storage の「article-images」バケット(公開)に保存されます。
-- バケットはアプリ側から作成済みのため、手動作成は不要です。

-- ============================================================
-- 追記マイグレーション: 料金目安といいね数の列を追加
--
-- すでにテーブルを作成済みの環境では、下の2文だけをSQL Editorで実行してください。
-- ============================================================
alter table media_posts add column if not exists price_range text;
alter table media_posts add column if not exists likes int not null default 0;
