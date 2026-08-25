import { sitemapResponse } from "../lib/sitemap";
import { SITE } from "../lib/site";

export function GET() {
  return sitemapResponse([
    {
      path: "/",
      video: {
        thumbnail: `${SITE.url}/video/kastriot-tanaj-poster.jpg`,
        title: "Meet Kastriot Tanaj — SEO and AI automation",
        description:
          "A short introduction from Kastriot Tanaj, an SEO specialist and AI automation builder helping businesses across Europe grow visibility and automate repetitive marketing work.",
        content: `${SITE.url}/video/kastriot-tanaj.mp4`,
        duration: 37,
        publicationDate: "2026-08-24",
      },
    },
    { path: "/northbound/" },
  ]);
}
