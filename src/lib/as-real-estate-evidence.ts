/**
 * The AS Real Estate screenshots behind /use-cases/real-estate/.
 *
 * Same contract as gerti-evidence.ts: shared between the page that renders them
 * and sitemap-use-cases.xml, which lists them for Google Images, so the two
 * cannot drift. Add a screenshot here and it appears in both.
 *
 * `strong` is the name Kastriot gave the file — the figcaption leads with it so
 * a reader can match a claim on the page to the export it came from.
 */

export interface EvidenceShot {
  /** Root-relative path under /assets/as-real-estate-evidence/. */
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
  performance: {
    src: "/assets/as-real-estate-evidence/performance.jpg",
    width: 1240,
    height: 414,
    alt: "Google Search Console performance report for asrealestate-rks.com over three months: 182 total clicks, 3.67K total impressions, 5% average CTR, average position 6.8",
    strong: "Performance",
    caption:
      "3 months · 182 clicks · 3.67K impressions · 5% CTR · avg. position 6.8",
  },
  insights: {
    src: "/assets/as-real-estate-evidence/insights.jpg",
    width: 1240,
    height: 332,
    alt: "Google Search Console insights for asrealestate-rks.com over the last 28 days: 98 clicks up 75 percent, 1.87K impressions up 38 percent",
    strong: "Insights",
    caption: "last 28 days · 98 clicks +75% · 1.87K impressions +38%",
  },
  clicks: {
    src: "/assets/as-real-estate-evidence/clicks.jpg",
    width: 938,
    height: 368,
    alt: "Google Search Console performance chart for asrealestate-rks.com showing 182 total web search clicks in daily peaks rising from late May to late August 2026",
    strong: "Clicks",
    caption: "182 total web search clicks · daily, May – Aug 2026",
  },
  generativeAi: {
    src: "/assets/as-real-estate-evidence/generative-ai-features.jpg",
    width: 1240,
    height: 491,
    alt: "Google Search Console generative AI features report for asrealestate-rks.com over three months: 345 total impressions, flat at zero until late June 2026 then rising through August",
    strong: "Generative AI features",
    caption: "345 impressions in Google's AI surfaces · 3 months",
  },
  indexing: {
    src: "/assets/as-real-estate-evidence/indexing-status.jpg",
    width: 834,
    height: 335,
    alt: "Google Search Console indexing chart for asrealestate-rks.com: 46 indexed pages and 10 not indexed, with the indexed count stepping up from 11 in late May to 46 by August 2026",
    strong: "Indexing status",
    caption: "46 pages indexed · 10 not indexed",
  },
  gtmetrix: {
    src: "/assets/as-real-estate-evidence/gt-metrix-report.jpg",
    width: 1240,
    height: 457,
    alt: "GTmetrix report for asrealestate-rks.com generated 27 August 2026: grade A, 100% performance, 92% structure, 539ms largest contentful paint, 0ms total blocking time, 0.03 cumulative layout shift",
    strong: "GTmetrix report",
    caption:
      "grade A · 100% performance · 92% structure · LCP 539ms · TBT 0ms · CLS 0.03",
  },
  localPerformance: {
    src: "/assets/as-real-estate-evidence/local-seo-performance.jpg",
    width: 1240,
    height: 650,
    alt: "Google Business Profile performance for AS Real Estate from March to August 2026: 246 Business Profile interactions, rising from zero in April to a plateau across June and July",
    strong: "Local SEO performance",
    caption: "246 Business Profile interactions · Mar – Aug 2026",
  },
  localCalls: {
    src: "/assets/as-real-estate-evidence/local-seo-calls.jpg",
    width: 1240,
    height: 536,
    alt: "Google Business Profile calls for AS Real Estate from March to August 2026: 13 calls made from the Business Profile, peaking at 10 in July 2026",
    strong: "Local SEO calls",
    caption: "13 calls straight from the Business Profile · Mar – Aug 2026",
  },
} satisfies Record<string, EvidenceShot>;

/** Every screenshot path, in render order — what the image sitemap lists. */
export const EVIDENCE_IMAGES: string[] = Object.values(EVIDENCE).map(
  (shot) => shot.src,
);
