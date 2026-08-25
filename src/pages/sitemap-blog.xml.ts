import { getCollection } from "astro:content";
import { newest, sitemapResponse } from "../lib/sitemap";

export async function GET() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  const entries = posts.map((post) => ({
    path: `/blog/${post.id}/`,
    lastmod: post.data.updatedDate ?? post.data.pubDate,
  }));
  return sitemapResponse([
    { path: "/blog/", lastmod: newest(entries.map((entry) => entry.lastmod)) },
    ...entries,
  ]);
}
