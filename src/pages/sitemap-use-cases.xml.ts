import { getCollection } from "astro:content";
import { sitemapResponse } from "../lib/sitemap";

export async function GET() {
  const useCases = await getCollection("useCases", ({ data }) => !data.draft);
  return sitemapResponse([
    { path: "/use-cases/" },
    ...useCases.map((useCase) => ({ path: `/use-cases/${useCase.id}/` })),
  ]);
}
