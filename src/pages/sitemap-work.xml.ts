import { getCollection } from "astro:content";
import { sitemapResponse } from "../lib/sitemap";
import { SITE } from "../lib/site";

export async function GET() {
  const work = await getCollection("work");
  return sitemapResponse([
    { path: "/work/" },
    ...work.map((item) => {
      const { video } = item.data;
      return {
        path: `/work/${item.id}/`,
        // A case study's own walkthrough is the subject of the page, so unlike
        // decorative footage it belongs in the sitemap.
        ...(video && {
          video: {
            thumbnail: new URL(video.poster, SITE.url).href,
            title: video.title,
            description: video.description,
            content: new URL(video.src, SITE.url).href,
            duration: video.duration,
            publicationDate: video.date,
          },
        }),
      };
    }),
  ]);
}
