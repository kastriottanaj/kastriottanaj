/**
 * The Albanien.Shop screenshots behind /use-cases/ecommerce/.
 *
 * Same contract as as-real-estate-evidence.ts: shared between the page that
 * renders them and sitemap-use-cases.xml, which lists them for Google Images,
 * so the two cannot drift. Add a screenshot here and it appears in both.
 *
 * Three sources, three windows, each labelled in its caption: Search Console's
 * three-month reports (10 Jun – 8 Sep 2026), Merchant Center's 28-day overview
 * (14 Aug – 10 Sep 2026) and its product-status view of the same 28 days, and
 * the structured-data and Core Web Vitals reports as last updated on 10 Sep
 * 2026. Do not round, restate or refresh a figure on the page without changing
 * the screenshot beside it.
 */

export interface EvidenceShot {
  /** Root-relative path under /assets/albanien-shop-evidence/. */
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
    src: "/assets/albanien-shop-evidence/search-console-performance.webp",
    width: 1252,
    height: 683,
    alt: "Google Search Console performance report for albanien.shop over three months, web search: 6.24K total clicks, 237K total impressions, 2.6% average CTR, average position 6.9, with daily clicks and impressions both stepping up from early August 2026",
    strong: "Search performance",
    caption: "3 months · 6.24K clicks · 237K impressions · 2.6% CTR · avg. position 6.9",
  },
  clicks: {
    src: "/assets/albanien-shop-evidence/search-console-clicks.webp",
    width: 1063,
    height: 486,
    alt: "Google Search Console overview chart for albanien.shop showing 6,237 total web search clicks, daily from 10 June to 8 September 2026, rising from around 40 a day in July to a peak near 120 in mid-August",
    strong: "Search clicks",
    caption: "6,237 total web search clicks · daily, Jun – Sep 2026",
  },
  generativeAi: {
    src: "/assets/albanien-shop-evidence/generative-ai-features.webp",
    width: 1219,
    height: 555,
    alt: "Google Search Console generative AI features report for albanien.shop over three months: 16.8K total impressions, around 100 a day until late July 2026 and 250 to 480 a day from mid-August",
    strong: "Generative AI features",
    caption: "16.8K impressions in Google's AI surfaces · 3 months",
  },
  coreWebVitals: {
    src: "/assets/albanien-shop-evidence/core-web-vitals.webp",
    width: 1207,
    height: 515,
    alt: "Google Search Console Core Web Vitals report for albanien.shop, mobile, last updated 10 September 2026: 279 good URLs, 0 URLs needing improvement, 0 poor URLs, with the good count climbing from around 190 in June to 279",
    strong: "Core Web Vitals",
    caption: "mobile · 279 good URLs · 0 need improvement · 0 poor · 10 Sep 2026",
  },
  merchantOverview: {
    src: "/assets/albanien-shop-evidence/merchant-center-overview.webp",
    width: 999,
    height: 580,
    alt: "Google Merchant Center overview for albanien.shop on 10 September 2026: 2.71K total clicks in the last 28 days, up 43.1% on the previous period, and 306 total products of which 304 are approved, 0 limited, 1 not approved and 1 under review",
    strong: "Merchant Center overview",
    caption: "28 days to 10 Sep 2026 · 2.71K clicks, +43.1% · 304 of 306 products approved",
  },
  merchantOverviewPrior: {
    src: "/assets/albanien-shop-evidence/merchant-center-overview-9-sep.webp",
    width: 1034,
    height: 556,
    alt: "Google Merchant Center overview for albanien.shop a day earlier, 9 September 2026: 2.67K clicks in the last 28 days, up 43.0%, and 119 total products with 118 approved, 0 not approved and 1 under review",
    strong: "Merchant Center, 9 Sep",
    caption: "the day before · 118 of 119 approved · 0 not approved, 77 fewer than a week earlier",
  },
  statusApproved: {
    src: "/assets/albanien-shop-evidence/product-status-approved.webp",
    width: 1688,
    height: 547,
    alt: "Google Merchant Center product status history for albanien.shop, 14 August to 10 September 2026, all marketing methods: the whole catalogue sits in the red not-approved band for weeks, then flips to the green approved band on 7 September",
    strong: "Product status history",
    caption: "not approved for weeks · approved from 7 Sep 2026",
  },
  statusNotApproved: {
    src: "/assets/albanien-shop-evidence/product-status-not-approved.webp",
    width: 1341,
    height: 794,
    alt: "Google Merchant Center product status changes for albanien.shop over the last 28 days, not-approved series only: between 75 and 125 products not approved from 14 August, falling to zero on 7 September 2026; latest status 110 products, 107 approved, 2 not approved, 1 under review",
    strong: "Not approved, last 28 days",
    caption: "75 – 125 products disapproved through August · zero from 7 Sep",
  },
  noIssues: {
    src: "/assets/albanien-shop-evidence/merchant-center-no-issues.webp",
    width: 1670,
    height: 896,
    alt: "Google Merchant Center products page for albanien.shop, Needs attention tab with prioritised fixes selected: Great, all your prioritized fixes are resolved",
    strong: "Needs attention",
    caption: "all prioritised fixes resolved",
  },
  supportEmail: {
    src: "/assets/albanien-shop-evidence/support-email-resolved.webp",
    width: 858,
    height: 236,
    alt: "Excerpt of an email from Google Ads support, gTech Customer Experience, to Albanien.Shop: We are glad to hear that the Misrepresentation concern has already been resolved, and we appreciate you keeping us informed of the separate logo concern",
    strong: "Google support",
    caption: "“the Misrepresentation concern has already been resolved” · gTech Customer Experience",
  },
  supportConfirmation: {
    src: "/assets/albanien-shop-evidence/support-confirmation-resolved.webp",
    width: 981,
    height: 40,
    alt: "One line from the support thread: Merchant Center Support confirmed that the Misrepresentation issue is resolved and specifically referred us to Google Business Profile Support regarding the logo",
    strong: "Support thread",
    caption: "Merchant Center Support confirmed the Misrepresentation issue is resolved",
  },
  merchantListings: {
    src: "/assets/albanien-shop-evidence/merchant-listings.webp",
    width: 1227,
    height: 607,
    alt: "Google Search Console merchant listings structured data report for albanien.shop, last updated 10 September 2026: 415 valid items, 8 invalid with 3 critical issues, valid items charted daily between roughly 350 and 500 from mid-June",
    strong: "Merchant listing markup",
    caption: "415 valid · 8 invalid · 10 Sep 2026",
  },
  productSnippets: {
    src: "/assets/albanien-shop-evidence/product-snippets.webp",
    width: 1248,
    height: 642,
    alt: "Google Search Console product snippets structured data report for albanien.shop, last updated 10 September 2026: 181 valid items, 1 invalid with 1 critical issue",
    strong: "Product snippet markup",
    caption: "181 valid · 1 invalid · 10 Sep 2026",
  },
  searchImpact: {
    src: "/assets/albanien-shop-evidence/google-search-impact.webp",
    width: 824,
    height: 551,
    alt: "Google Search Impact notice dated 1 April 2026: Congratulations! Your site reached 3.5K clicks from Google Search in the past 28 days",
    strong: "Search impact",
    caption: "3.5K clicks in 28 days · Google's notice of 1 Apr 2026",
  },
} satisfies Record<string, EvidenceShot>;

/** Every screenshot path, in render order — what the image sitemap lists. */
export const EVIDENCE_IMAGES: string[] = Object.values(EVIDENCE).map(
  (shot) => shot.src,
);
