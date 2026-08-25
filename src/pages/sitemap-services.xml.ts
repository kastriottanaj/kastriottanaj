import { getCollection } from "astro:content";
import { sitemapResponse } from "../lib/sitemap";

export async function GET() {
  const services = await getCollection("services");
  return sitemapResponse([
    { path: "/services/" },
    ...services.map((service) => ({ path: `/services/${service.id}/` })),
  ]);
}
