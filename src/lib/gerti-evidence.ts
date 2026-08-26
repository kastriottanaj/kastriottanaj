/**
 * The Gerti Foods case-study screenshots — the only real content images on the
 * site. Shared so the page that renders them and sitemap-work.xml, which has to
 * list them for Google Images, cannot drift apart: add a screenshot here and it
 * appears in both.
 */

export interface EvidenceShot {
  /** Root-relative path under /assets/gerti-evidence/. */
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
  gsc: {
    src: "/assets/gerti-evidence/gsc-performance-28d.jpg",
    width: 1240,
    height: 658,
    alt: "Google Search Console performance chart for gertifoods.com over 28 days: 62 clicks, 1.8K impressions, 3.4% CTR, average position 7.7",
    strong: "Google Search Console",
    caption:
      "28 days · 62 clicks · 1.8K impressions · 3.4% CTR · avg. position 7.7",
  },
  indicators: {
    src: "/assets/gerti-evidence/ubersuggest-key-indicators.jpg",
    width: 383,
    height: 349,
    alt: "Ubersuggest key SEO indicators: 5 organic keywords up 400%, organic traffic 55 up 96.4%, 14 backlinks up 7.7%",
    strong: "Ubersuggest",
    caption: "keywords, traffic, backlinks",
  },
  onpage: {
    src: "/assets/gerti-evidence/ubersuggest-onpage-score.jpg",
    width: 362,
    height: 266,
    alt: "Ubersuggest on-page SEO score for gertifoods.com: 73, rated high",
    strong: "On-page score",
    caption: "73 / 100",
  },
  gtmetrix: {
    src: "/assets/gerti-evidence/gtmetrix-report.jpg",
    width: 1240,
    height: 454,
    alt: "GTmetrix report for gertifoods.com: grade A, 95% performance, 97% structure, 1.1s largest contentful paint, 66ms total blocking time, 0.08 cumulative layout shift",
    strong: "GTmetrix",
    caption:
      "grade A · 95% performance · 97% structure · LCP 1.1s · TBT 66ms · CLS 0.08",
  },
  traffic: {
    src: "/assets/gerti-evidence/ubersuggest-organic-traffic.jpg",
    width: 900,
    height: 740,
    alt: "Ubersuggest monthly organic traffic for gertifoods.com: flat at zero from August 2025 to May 2026, then rising to 55 visits by July 2026",
    strong: "Organic traffic",
    caption: "nine flat months, then the climb",
  },
  insights: {
    src: "/assets/gerti-evidence/gsc-insights.jpg",
    width: 1240,
    height: 322,
    alt: "Google Search Console insights panel: 62 clicks up 19 percent, 1.8K impressions up 67 percent over the last 28 days",
    strong: "Search Console insights",
    caption: "clicks +19% · impressions +67% month on month",
  },
} satisfies Record<string, EvidenceShot>;

/** Every screenshot path, in render order — what the image sitemap lists. */
export const EVIDENCE_IMAGES: string[] = Object.values(EVIDENCE).map(
  (shot) => shot.src,
);
