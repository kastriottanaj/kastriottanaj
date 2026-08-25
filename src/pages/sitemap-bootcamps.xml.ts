import { getCollection } from "astro:content";
import { sitemapResponse } from "../lib/sitemap";

export async function GET() {
  const bootcamps = await getCollection("bootcamps", ({ data }) => !data.draft);
  return sitemapResponse([
    { path: "/bootcamps/" },
    ...bootcamps.map((bootcamp) => ({ path: `/bootcamps/${bootcamp.id}/` })),
  ]);
}
