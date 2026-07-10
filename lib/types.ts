// Supabaseの各テーブルに対応するTypeScriptの型定義。
// supabase/schema.sql の定義と手動で一致させる(MVPでは型自動生成は行わない)。

export type ProjectStatus = "draft" | "in_progress" | "completed" | "generated";

export type Project = {
  id: string;
  owner_id: string;
  article_type: string;
  theme: string;
  target_reader: string;
  tone: string;
  has_photo: boolean;
  word_count: number;
  share_token: string;
  status: ProjectStatus;
  created_at: string;
};

export type InterviewSessionStatus = "in_progress" | "completed";

export type InterviewSession = {
  id: string;
  project_id: string;
  status: InterviewSessionStatus;
  progress: number;
  created_at: string;
};

export type MessageRole = "user" | "assistant";

export type InterviewMessage = {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
};

export type GeneratedArticle = {
  id: string;
  project_id: string;
  content: string;
  generated_at: string;
};

export type MediaPostStatus = "draft" | "published";

// 公開メディア「うちのトリマーさん」に掲載する記事。
// 生成記事は再生成で上書きされるため、公開時に本文をここへコピーして固定する。
export type MediaPost = {
  id: string;
  owner_id: string;
  project_id: string | null;
  slug: string;
  title: string;
  trimmer_name: string;
  salon_name: string;
  area: string;
  instagram_url: string | null;
  website_url: string | null;
  content: string;
  status: MediaPostStatus;
  published_at: string;
  created_at: string;
};

// @supabase/ssr の createBrowserClient / createServerClient に渡す型。
// MVPではテーブル定義を直接書く簡易版とし、Supabase CLIによる型自動生成は導入しない。
// (Relationships は外部キーの型推論に使われるが、MVPでは空配列で問題ない)
export type Database = {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Partial<Project> &
          Pick<Project, "owner_id" | "article_type" | "theme" | "target_reader" | "tone" | "has_photo" | "word_count" | "share_token">;
        Update: Partial<Project>;
        Relationships: [];
      };
      interview_sessions: {
        Row: InterviewSession;
        Insert: Partial<InterviewSession> & Pick<InterviewSession, "project_id">;
        Update: Partial<InterviewSession>;
        Relationships: [];
      };
      interview_messages: {
        Row: InterviewMessage;
        Insert: Partial<InterviewMessage> &
          Pick<InterviewMessage, "session_id" | "role" | "content">;
        Update: Partial<InterviewMessage>;
        Relationships: [];
      };
      generated_articles: {
        Row: GeneratedArticle;
        Insert: Partial<GeneratedArticle> &
          Pick<GeneratedArticle, "project_id" | "content">;
        Update: Partial<GeneratedArticle>;
        Relationships: [];
      };
      media_posts: {
        Row: MediaPost;
        Insert: Partial<MediaPost> &
          Pick<MediaPost, "owner_id" | "slug" | "title" | "trimmer_name" | "salon_name" | "area" | "content">;
        Update: Partial<MediaPost>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
