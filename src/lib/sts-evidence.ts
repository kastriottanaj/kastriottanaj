/**
 * The STS Bau screenshots behind /work/sts-company/.
 *
 * Same contract as gerti-evidence.ts and as-real-estate-evidence.ts: shared
 * between the page that renders them and sitemap-work.xml, which lists them for
 * Google Images, so the two cannot drift. Add a screenshot here and it appears
 * in both.
 *
 * `strong` is the name Kastriot gave the file — the figcaption leads with it so
 * a reader can match a claim on the page to the export it came from.
 *
 * Three sources, three windows, and the captions say which is which:
 *  - Ubersuggest, exported 28 Aug 2026 (Germany / German).
 *  - GTmetrix, report generated 27 Aug 2026 from Seattle.
 *  - Google Business Profile, Mar – Aug 2026.
 */

export interface EvidenceShot {
  /** Root-relative path under /assets/sts-evidence/. */
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Bolded lead-in of the figcaption. */
  strong: string;
  caption: string;
}

/* Intrinsic sizes are the real file dimensions — they reserve the box so the
   gallery cannot shift as the screenshots decode. */
export const EVIDENCE = {
  gtmetrix: {
    src: "/assets/sts-evidence/gt-metrix-report.jpg",
    width: 1240,
    height: 442,
    alt: "GTmetrix report for sts-steuerungstechnik.de generated 27 August 2026: grade A, 97% performance, 99% structure, 1.1s largest contentful paint, 0ms total blocking time, 0 cumulative layout shift",
    strong: "GT Metrix report",
    caption:
      "grade A · 97% performance · 99% structure · LCP 1.1s · TBT 0ms · CLS 0",
  },
  indicators: {
    src: "/assets/sts-evidence/key-seo-indicators.jpg",
    width: 538,
    height: 325,
    alt: "Ubersuggest key SEO indicators for sts-steuerungstechnik.de: 217 organic keywords up 0.5%, 57 organic traffic up 14%, 18 backlinks up 800%",
    strong: "Key SEO indicators",
    caption: "217 keywords · 57 traffic · 18 backlinks (+800%)",
  },
  onpage: {
    src: "/assets/sts-evidence/onpage-score.jpg",
    width: 551,
    height: 262,
    alt: "Ubersuggest on-page SEO score for sts-steuerungstechnik.de: 89, rated high",
    strong: "Onpage score",
    caption: "89 / 100",
  },
  traffic: {
    src: "/assets/sts-evidence/organic-traffic.jpg",
    width: 900,
    height: 740,
    alt: "Ubersuggest monthly organic traffic for sts-steuerungstechnik.de, German market: 2 visits in August 2025 climbing to 24 by November 2025, stepping up to 57 in February 2026 and holding between 50 and 66 through July 2026",
    strong: "Organic traffic",
    caption: "2 → 57 monthly visits · Aug 2025 – Jul 2026",
  },
  profileViews: {
    src: "/assets/sts-evidence/people-viewed-your-business.jpg",
    width: 543,
    height: 609,
    alt: "Google Business Profile views for STS: 992 people viewed the profile, split 453 (46%) Google Search mobile, 308 (31%) Google Search desktop, 135 (14%) Google Maps mobile and 96 (10%) Google Maps desktop",
    strong: "People viewed your business",
    caption: "992 views · 77% from Search, 23% from Maps",
  },
  directions: {
    src: "/assets/sts-evidence/directions-requests.jpg",
    width: 1205,
    height: 403,
    alt: "Google Business Profile direction requests for STS from March to August 2026: 272 direction requests, running between roughly 35 and 65 a month",
    strong: "Directions requests",
    caption: "272 direction requests · Mar – Aug 2026",
  },
  websiteClicks: {
    src: "/assets/sts-evidence/website-clicks.jpg",
    width: 1196,
    height: 696,
    alt: "Google Business Profile website clicks for STS from March to August 2026: 44 clicks through to the website, dipping in July then rising to the six-month high in August 2026",
    strong: "Website clicks",
    caption: "44 clicks to the site · Mar – Aug 2026",
  },
} satisfies Record<string, EvidenceShot>;

/** Every screenshot path, in render order — what the image sitemap lists. */
export const EVIDENCE_IMAGES: string[] = Object.values(EVIDENCE).map(
  (shot) => shot.src,
);
