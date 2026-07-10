import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import MediaPostForm from "../MediaPostForm";
import DeletePostButton from "./DeletePostButton";
import { updateMediaPost, deleteMediaPost } from "../actions";

export default async function EditMediaPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: post } = await supabase
    .from("media_posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (!post) {
    notFound();
  }

  const updateAction = updateMediaPost.bind(null, post.id);
  const deleteAction = deleteMediaPost.bind(null, post.id);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">記事を編集</h1>
        <DeletePostButton deleteAction={deleteAction} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <MediaPostForm
          action={updateAction}
          defaults={post}
          submitLabel="変更を保存"
          showStatus
        />
      </div>
    </div>
  );
}
