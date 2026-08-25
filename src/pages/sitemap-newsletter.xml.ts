import { getCollection } from "astro:content";
import { newest, sitemapResponse } from "../lib/sitemap";

export async function GET() {
  const issues = await getCollection("newsletter", ({ data }) => !data.draft);
  const entries = issues.map((issue) => ({
    path: `/newsletter/archive/${issue.id}/`,
    lastmod: issue.data.pubDate,
  }));
  return sitemapResponse([
    { path: "/newsletter/", lastmod: newest(entries.map((entry) => entry.lastmod)) },
    ...entries,
  ]);
}
