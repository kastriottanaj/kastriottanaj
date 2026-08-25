import { getCollection } from "astro:content";
import { sitemapResponse } from "../lib/sitemap";

export async function GET() {
  const work = await getCollection("work");
  return sitemapResponse([
    { path: "/work/" },
    ...work.map((item) => ({ path: `/work/${item.id}/` })),
  ]);
}
