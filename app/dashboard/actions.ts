"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function createProject(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const articleType = String(formData.get("article_type") ?? "").trim();
  const theme = String(formData.get("theme") ?? "").trim();
  const targetReader = String(formData.get("target_reader") ?? "").trim();
  const tone = String(formData.get("tone") ?? "").trim();
  const hasPhoto = formData.get("has_photo") === "on";
  const wordCount = Number(formData.get("word_count") ?? 0);

  if (!articleType || !theme || !targetReader || !tone || !wordCount) {
    throw new Error("すべての項目を入力してください。");
  }

  const shareToken = randomBytes(9).toString("base64url");

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      article_type: articleType,
      theme,
      target_reader: targetReader,
      tone,
      has_photo: hasPhoto,
      word_count: wordCount,
      share_token: shareToken,
    })
    .select("id")
    .single();

  if (error || !project) {
    throw new Error(`案件の作成に失敗しました: ${error?.message}`);
  }

  redirect(`/dashboard/${project.id}`);
}

export async function deleteProject(projectId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("projects").delete().eq("id", projectId);

  if (error) {
    throw new Error(`案件の削除に失敗しました: ${error.message}`);
  }
}
