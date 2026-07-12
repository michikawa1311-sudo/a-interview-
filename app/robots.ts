import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// 検索エンジンのクロール設定。管理画面・API・インタビューページは検索結果に出さない。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/login", "/api/", "/interview/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
