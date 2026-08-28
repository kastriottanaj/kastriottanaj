import { getCollection } from "astro:content";
import { sitemapResponse } from "../lib/sitemap";
import { EVIDENCE_IMAGES as GERTI_IMAGES } from "../lib/gerti-evidence";
import { EVIDENCE_IMAGES as STS_IMAGES } from "../lib/sts-evidence";
import { SITE } from "../lib/site";

/** Content images a hand-built case-study page renders, keyed by its slug. */
const bespokeImages: Record<string, string[]> = {
  "gerti-foods": GERTI_IMAGES,
  "sts-company": STS_IMAGES,
};

export async function GET() {
  const work = await getCollection("work");
  return sitemapResponse([
    { path: "/work/" },
    ...work.map((item) => {
      const { video } = item.data;
      return {
        path: `/work/${item.id}/`,
        // The poster is a rendered image in its own right, so it is listed for
        // Google Images as well as being the video's thumbnail.
        images: [
          ...(bespokeImages[item.id] ?? []),
          ...(video ? [video.poster] : []),
        ],
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
