import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<string, string> = {
  draft: "回答待ち",
  in_progress: "回答中",
  completed: "回答完了",
  generated: "記事生成済み",
};

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">インタビュー案件一覧</h1>
        <Link
          href="/dashboard/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          + 新規案件を作成
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <p className="text-sm text-gray-500">
          まだ案件がありません。「新規案件を作成」から始めてください。
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/dashboard/${project.id}`}
                className="flex items-center justify-between px-4 py-4 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {project.article_type} / {project.theme}
                  </p>
                  <p className="text-sm text-gray-500">{project.target_reader}</p>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                  {STATUS_LABEL[project.status] ?? project.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
