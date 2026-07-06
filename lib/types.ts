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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
