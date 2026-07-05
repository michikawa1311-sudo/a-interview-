# A.Interview

記事作成者がインタビュー用リンクを発行し、回答者がAIチャットに答えるだけで店舗紹介・個人インタビュー・商品紹介・ブログ・アフィリエイト記事などを自動生成できるサービスです。

## 使っている技術

- Next.js (App Router) / TypeScript / Tailwind CSS
- Supabase (データベース + 管理者ログイン)
- Claude API (AIインタビュー・記事生成)
- Vercel (デプロイ先)

## セットアップ手順

### 1. Supabaseプロジェクトを作成する

1. [supabase.com](https://supabase.com) でプロジェクトを新規作成
2. 左メニューの **SQL Editor** を開き、このリポジトリの `supabase/schema.sql` の中身を全部コピーして貼り付け、実行(Run)する
   - これでテーブル(`projects` / `interview_sessions` / `interview_messages` / `generated_articles`)が作成されます
3. **Authentication > Providers** で Email が有効になっていることを確認
4. **Authentication > Users** から、管理者用のユーザー(自分のメールアドレス)を1人作成する
5. **Project Settings > API** から以下を控える
   - Project URL
   - `anon` `public` キー
   - `service_role` キー(絶対に公開しない)

### 2. Claude APIキーを取得する

[console.anthropic.com](https://console.anthropic.com) で API キーを発行する。

### 3. 環境変数を設定する

`.env.local.example` をコピーして `.env.local` を作成し、上記で控えた値を入力する。

```bash
cp .env.local.example .env.local
```

### 4. ローカルで起動する

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開くと `/login` にリダイレクトされます。手順1-4で作成した管理者アカウントでログインしてください。

### 5. Vercelにデプロイする

1. このリポジトリをVercelにインポート
2. `.env.local` に設定したのと同じ環境変数を、Vercelの **Settings > Environment Variables** にも設定する
3. デプロイ

## 使い方の流れ

1. 管理者でログインし、「新規案件を作成」から記事タイプ・テーマ・読者ターゲット・トーン・写真の有無・文字数を入力
2. 発行されたインタビュー用リンクを回答者に共有する
3. 回答者はログイン不要でリンクを開き、AIチャットに沿って回答する
4. 回答が終わると管理画面に「記事を生成」ボタンが表示されるので押す
5. 生成された記事を確認し、コピーボタンで本文をコピーする

## フォルダ構成

```
app/
  login/                管理者ログイン画面
  dashboard/             管理画面(案件一覧・作成・詳細)
  interview/[token]/      回答者向けAIチャット画面(ログイン不要)
  api/
    interview/[token]/chat/   AIチャットの送受信API
    projects/[id]/generate/   記事生成API
lib/
  supabase/               Supabase接続用クライアント
  claude/                 Claude API接続・プロンプト
  types.ts                データベースの型定義
supabase/
  schema.sql              テーブル定義(Supabase SQL Editorで実行する)
```
