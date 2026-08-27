import { getCollection } from "astro:content";
import { sitemapResponse } from "../lib/sitemap";
import { EVIDENCE_IMAGES } from "../lib/as-real-estate-evidence";
import { SITE } from "../lib/site";

/** Content images a hand-built use-case page renders, keyed by its slug. */
const bespokeImages: Record<string, string[]> = {
  "real-estate": EVIDENCE_IMAGES,
};

export async function GET() {
  const useCases = await getCollection("useCases", ({ data }) => !data.draft);
  return sitemapResponse([
    { path: "/use-cases/" },
    ...useCases.map((useCase) => {
      const { video } = useCase.data;
      return {
        path: `/use-cases/${useCase.id}/`,
        // The poster is a rendered image in its own right, so it is listed for
        // Google Images as well as being the video's thumbnail.
        images: [
          ...(bespokeImages[useCase.id] ?? []),
          ...(video ? [video.poster] : []),
        ],
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
