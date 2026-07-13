"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// フォームの共通項目を取り出して検証する。
function parseMediaPostForm(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const title = String(formData.get("title") ?? "").trim();
  const trimmerName = String(formData.get("trimmer_name") ?? "").trim();
  const salonName = String(formData.get("salon_name") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const nearestStation = String(formData.get("nearest_station") ?? "").trim();
  const photoUrl = String(formData.get("photo_url") ?? "").trim();
  const phoneNumber = String(formData.get("phone_number") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const priceRange = String(formData.get("price_range") ?? "").trim();
  const instagramUrl = String(formData.get("instagram_url") ?? "").trim();
  const websiteUrl = String(formData.get("website_url") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  // 明示的に「公開」を選んだ場合のみ公開。それ以外は非公開(下書き)として保存する。
  const status = formData.get("status") === "published" ? "published" : "draft";

  if (!slug || !title || !trimmerName || !salonName || !area || !content) {
    throw new Error("必須項目が入力されていません。");
  }

  // URLの一部になるため、半角英数字とハイフンのみ許可する。
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error("URL用の文字列(スラッグ)は半角英数字とハイフンのみ使用できます。");
  }

  return {
    slug,
    title,
    trimmer_name: trimmerName,
    salon_name: salonName,
    area,
    address: address || null,
    nearest_station: nearestStation || null,
    photo_url: photoUrl || null,
    phone_number: phoneNumber || null,
    tagline: tagline || null,
    price_range: priceRange || null,
    instagram_url: instagramUrl || null,
    website_url: websiteUrl || null,
    content,
    status,
  } as const;
}

export async function publishMediaPost(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fields = parseMediaPostForm(formData);
  const projectId = String(formData.get("project_id") ?? "").trim() || null;

  const { error } = await supabase.from("media_posts").insert({
    owner_id: user.id,
    project_id: projectId,
    ...fields,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error("このスラッグ(URL用文字列)はすでに使われています。別の文字列にしてください。");
    }
    throw new Error(`記事の公開に失敗しました: ${error.message}`);
  }

  revalidatePath("/");
  redirect("/dashboard/posts");
}

export async function updateMediaPost(postId: string, formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fields = parseMediaPostForm(formData);

  const { error } = await supabase.from("media_posts").update(fields).eq("id", postId);

  if (error) {
    throw new Error(`記事の更新に失敗しました: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath(`/trimmers/${fields.slug}`);
  redirect("/dashboard/posts");
}

// 公開記事一覧からワンクリックで公開/非公開を切り替える。
export async function toggleMediaPostStatus(postId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: post } = await supabase
    .from("media_posts")
    .select("status, slug")
    .eq("id", postId)
    .single();

  if (!post) {
    throw new Error("記事が見つかりません。");
  }

  const newStatus = post.status === "published" ? "draft" : "published";

  const { error } = await supabase
    .from("media_posts")
    .update({ status: newStatus, ...(newStatus === "published" && { published_at: new Date().toISOString() }) })
    .eq("id", postId);

  if (error) {
    throw new Error(`公開状態の変更に失敗しました: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath(`/trimmers/${post.slug}`);
  revalidatePath("/dashboard/posts");
}

export async function deleteMediaPost(postId: string) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("media_posts").delete().eq("id", postId);

  if (error) {
    throw new Error(`記事の削除に失敗しました: ${error.message}`);
  }

  revalidatePath("/");
  redirect("/dashboard/posts");
}
