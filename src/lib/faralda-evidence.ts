/**
 * The Faralda Crane Hotel screenshots behind /work/faralda-crane-hotel/.
 *
 * Same contract as gerti-evidence.ts and sts-evidence.ts: shared between the
 * page that renders them and sitemap-work.xml, which lists them for Google
 * Images, so the two cannot drift. Add a screenshot here and it appears in
 * both.
 *
 * `strong` is the name Kastriot gave the file — the figcaption leads with it so
 * a reader can match a claim on the page to the export it came from.
 *
 * Two sources, two windows, and the captions say which is which:
 *  - Semrush, faralda.com — rankings, traffic and AI-search visibility.
 *  - Google Business Profile, Jan – Apr 2025 — the interaction counts.
 *
 * The GBP window is a fixed four months and the Semrush figures are current, so
 * the two are never added together or presented as one period. Every number on
 * the page is read off the screenshot beside it: do not round, restate or
 * refresh one without changing the screenshot too.
 *
 * These are PNGs where the sibling case studies use JPEG. They are UI captures
 * of small text — JPEG came out 56% larger *and* softer, so the convention
 * loses to the file here.
 */

export interface EvidenceShot {
  /** Root-relative path under /assets/faralda-evidence/. */
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
  semrushKeywords: {
    src: "/assets/faralda-evidence/semrush-keywords.png",
    width: 1151,
    height: 348,
    alt: "Semrush organic keywords for faralda.com from October 2024 to July 2026, stacked by position bucket — top 3, 4-10, 11-20, 21-50 and 51-100 — holding above 400 keywords throughout, with an AI Overviews band appearing from early 2026",
    strong: "Keywords by position",
    caption:
      "Semrush · Oct 2024 – Jul 2026 · a steady top-3 band, with AI Overviews appearing in 2026",
  },
  topKeywords: {
    src: "/assets/faralda-evidence/semrush-top-organic-keywords.png",
    width: 553,
    height: 295,
    alt: "Semrush top organic keywords for faralda.com: crane hotel faralda amsterdam, crane hotel faralda, faralda crane hotel, faralda hotel amsterdam and hotel faralda crane, each ranking at position 1, with monthly volumes of 210, 140, 110, 110 and 260",
    strong: "Top organic keywords",
    caption:
      "Semrush · position 1 on all five lead terms · 23 top organic keywords in total",
  },
  domainOverview: {
    src: "/assets/faralda-evidence/semrush-domain-overview.png",
    width: 397,
    height: 186,
    alt: "Semrush overview for faralda.com: authority score 34 rated good, organic traffic 12.5K up 13 percent, 45 percent traffic share from Germany, and 482 organic keywords up 24 percent",
    strong: "Domain overview",
    caption:
      "Semrush · 12.5K organic traffic (+13%) · 482 keywords (+24%) · authority score 34",
  },
  aiVisibility: {
    src: "/assets/faralda-evidence/semrush-ai-visibility.png",
    width: 518,
    height: 234,
    alt: "Semrush AI search panel for faralda.com: AI visibility 25, 232 mentions and 135 cited pages, broken down as ChatGPT 57 mentions and 102 cited pages, AI Overview 32 and 14, AI Mode 77 and 52, Gemini 66 and 10",
    strong: "AI search visibility",
    caption:
      "Semrush · 232 mentions · 135 cited pages · across ChatGPT, AI Overviews, AI Mode and Gemini",
  },
  gbpInteractions: {
    src: "/assets/faralda-evidence/gbp-total-interactions.png",
    width: 605,
    height: 153,
    alt: "Google Business Profile performance for Faralda Crane Hotel, January to April 2025: 3,525 Business Profile interactions",
    strong: "Profile interactions",
    caption: "Google Business Profile · 3,525 interactions · Jan – Apr 2025",
  },
  gbpDirections: {
    src: "/assets/faralda-evidence/gbp-direction-requests.png",
    width: 609,
    height: 173,
    alt: "Google Business Profile performance for Faralda Crane Hotel, January to April 2025: 790 direction requests made from the Business Profile",
    strong: "Direction requests",
    caption: "Google Business Profile · 790 requests · Jan – Apr 2025",
  },
  gbpBookings: {
    src: "/assets/faralda-evidence/gbp-booking-clicks.png",
    width: 618,
    height: 181,
    alt: "Google Business Profile performance for Faralda Crane Hotel, January to April 2025: 170 clicks on the hotel's free booking link",
    strong: "Booking-link clicks",
    caption: "Google Business Profile · 170 clicks · Jan – Apr 2025",
  },
} satisfies Record<string, EvidenceShot>;

/** Every screenshot path, in render order — what the image sitemap lists. */
export const EVIDENCE_IMAGES: string[] = Object.values(EVIDENCE).map(
  (shot) => shot.src,
);
