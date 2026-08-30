import { sitemapResponse } from "../lib/sitemap";
import { SITE } from "../lib/site";

export function GET() {
  return sitemapResponse([
    {
      path: "/",
      images: ["/video/kastriot-tanaj-poster.jpg"],
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
    { path: "/process/" },
    { path: "/pricing/" },
    { path: "/contact/" },
    {
      path: "/northbound/",
      images: ["/video/shkoder-poster.jpg"],
      // The hero reel is the page: Northbound sells the place, and this is the
      // only footage of it. Duration is the encode's 30.4s truncated to whole
      // seconds — the video sitemap spec rejects fractions.
      video: {
        thumbnail: `${SITE.url}/video/shkoder-poster.jpg`,
        title: "Northbound Albania — Shkodër and the wild north",
        description:
          "Aerial footage of Shkodër and the mountains of Northern Albania, the setting for Northbound's private, tailor-made journeys through Theth, Koman and Valbonë.",
        content: `${SITE.url}/video/shkoder-web-1080p.mp4`,
        duration: 30,
        publicationDate: "2026-08-24",
      },
    },
  ]);
}
