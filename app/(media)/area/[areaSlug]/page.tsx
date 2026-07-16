import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { findAreaBySlug, MEDIA_AREAS, SITE_NAME, SITE_URL } from "@/lib/site";
import PostCard from "../../PostCard";

export function generateStaticParams() {
  return MEDIA_AREAS.map((area) => ({ areaSlug: area.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ areaSlug: string }>;
}): Promise<Metadata> {
  const { areaSlug } = await params;
  const area = findAreaBySlug(areaSlug);

  if (!area) {
    return { title: `ページが見つかりません | ${SITE_NAME}` };
  }

  const title = `${area.name}のトリマー・トリミングサロン紹介 | ${SITE_NAME}`;
  const description = `${area.name}のトリミングサロンを、料金や場所ではなく「トリマーさんの人柄とこだわり」で紹介します。インタビューをもとにした記事で、大切なうちの子を任せられるトリマーさんが見つかります。`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/area/${area.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: SITE_NAME,
      url: `${SITE_URL}/area/${area.slug}`,
      locale: "ja_JP",
    },
  };
}

export default async function AreaPage({
  params,
}: {
  params: Promise<{ areaSlug: string }>;
}) {
  const { areaSlug } = await params;
  const area = findAreaBySlug(areaSlug);

  if (!area) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();
  const { data: posts } = await supabase
    .from("media_posts")
    .select("*")
    .eq("status", "published")
    .eq("area", area.name)
    .order("published_at", { ascending: false });

  const areaPosts = posts ?? [];

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
      { "@type": "ListItem", position: 2, name: area.name, item: `${SITE_URL}/area/${area.slug}` },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: areaPosts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: post.title,
      url: `${SITE_URL}/trimmers/${post.slug}`,
    })),
  };

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <nav className="text-xs text-gray-400">
        <Link href="/" className="hover:text-amber-700">
          トップ
        </Link>
        <span className="mx-1">›</span>
        <span className="text-gray-600">{area.name}</span>
      </nav>

      <section>
        <h1 className="mb-3 text-2xl font-bold text-gray-900">
          {area.name}のトリマー・トリミングサロン
        </h1>
        <p className="text-sm leading-relaxed text-gray-600">
          {area.name}
          でトリミングサロンをお探しの飼い主さんへ。料金や場所の一覧では分からない、トリマーさん一人ひとりの人柄・カットやシャンプーへのこだわり・お店の雰囲気を、インタビューをもとにした記事で紹介します。
        </p>
      </section>

      {areaPosts.length === 0 ? (
        <p className="text-sm text-gray-500">
          {area.name}の記事を準備中です。もうしばらくお待ちください。
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {areaPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <div>
        <Link href="/" className="text-sm font-medium text-amber-700 hover:text-amber-900">
          ← トップページへ戻る
        </Link>
      </div>
    </div>
  );
}
