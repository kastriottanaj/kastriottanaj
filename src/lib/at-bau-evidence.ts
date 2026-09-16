/**
 * The AT Bau screenshots behind /use-cases/at-bau/.
 *
 * Same contract as as-real-estate-evidence.ts: shared between the page that
 * renders them and sitemap-use-cases.xml, which lists them for Google Images,
 * so the two cannot drift. Add a screenshot here and it appears in both.
 *
 * All five are Google Business Profile exports for the six months to
 * mid-September 2026 (the September point is half a month), plus the
 * knowledge panel as Google draws it. There is no Search Console set: the
 * page's claim is the listing, not the organic rankings.
 */

export interface EvidenceShot {
  /** Root-relative path under /assets/at-bau-evidence/. */
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Bolded lead-in of the figcaption, and the tile caption in the hero column. */
  strong: string;
  caption: string;
}

/* Intrinsic sizes are the real file dimensions — they reserve the box so the
   tiles cannot shift as the screenshots decode. */
export const EVIDENCE = {
  interactions: {
    src: "/assets/at-bau-evidence/business-profile-interactions.webp",
    width: 1156,
    height: 445,
    alt: "Google Business Profile performance chart for AT Bau, April to September 2026: 344 Business Profile interactions, peaking around 90 in May, dipping to about 40 in July and recovering to about 75 in August",
    strong: "344 interactions",
    caption: "Business Profile interactions · Apr – Sep 2026",
  },
  directions: {
    src: "/assets/at-bau-evidence/direction-requests.webp",
    width: 1205,
    height: 458,
    alt: "Google Business Profile chart for AT Bau, April to September 2026: 229 direction requests made from the Business Profile, peaking at 60 in May and 53 in August",
    strong: "229 direction requests",
    caption: "made from the Business Profile · Apr – Sep 2026",
  },
  websiteClicks: {
    src: "/assets/at-bau-evidence/website-clicks.webp",
    width: 1186,
    height: 489,
    alt: "Google Business Profile chart for AT Bau, April to September 2026: 103 website clicks made from the Business Profile, between 17 and 24 a month from April to August",
    strong: "103 website clicks",
    caption: "made from the Business Profile · Apr – Sep 2026",
  },
  calls: {
    src: "/assets/at-bau-evidence/calls-from-business-profile.webp",
    width: 1189,
    height: 402,
    alt: "Google Business Profile chart for AT Bau, April to September 2026: 8 calls made from the Business Profile, four of them in May",
    strong: "8 calls from the listing",
    caption: "made from the Business Profile · Apr – Sep 2026",
  },
  knowledgePanel: {
    src: "/assets/at-bau-evidence/google-knowledge-panel.webp",
    width: 395,
    height: 116,
    alt: "Google knowledge panel for AT BAU, Gartenbau and Baumaschinenvermietung in Remscheid: 5.0 stars from 24 Google reviews, construction company in Remscheid, Germany",
    strong: "5.0 from 24 Google reviews",
    caption: "the listing as Google shows it · September 2026",
  },
} satisfies Record<string, EvidenceShot>;

/** Every screenshot path, in render order — what the image sitemap lists. */
export const EVIDENCE_IMAGES: string[] = Object.values(EVIDENCE).map(
  (shot) => shot.src,
);
