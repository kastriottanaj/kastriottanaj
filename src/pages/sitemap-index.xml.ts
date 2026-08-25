import { getCollection } from "astro:content";
import { newest, sitemapIndexResponse } from "../lib/sitemap";

export async function GET() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  const issues = await getCollection("newsletter", ({ data }) => !data.draft);

  return sitemapIndexResponse([
    { path: "/sitemap-pages.xml" },
    { path: "/sitemap-services.xml" },
    {
      path: "/sitemap-blog.xml",
      lastmod: newest(posts.map((post) => post.data.updatedDate ?? post.data.pubDate)),
    },
    { path: "/sitemap-work.xml" },
    { path: "/sitemap-bootcamps.xml" },
    { path: "/sitemap-newsletter.xml", lastmod: newest(issues.map((issue) => issue.data.pubDate)) },
  ]);
}
