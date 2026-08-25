import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
// Astro 7 deprecates the `z` re-export from astro:content — it ships zod v4 here.
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const work = defineCollection({
  loader: glob({ base: "./src/content/work", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    client: z.string(),
    /** One line for the card on the homepage and /work/. */
    summary: z.string(),
    /** Meta description for the case-study page. */
    description: z.string(),
    services: z.array(z.string()).default([]),
    year: z.number().optional(),
    /** Placeholder caption used until a real screenshot is dropped in. */
    thumbCaption: z.string().optional(),
    image: z.string().optional(),
    order: z.number().default(99),
    draft: z.boolean().default(false),
  }),
});

const services = defineCollection({
  loader: glob({ base: "./src/content/services", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    /** Page <title> and H1 can differ from the short nav label. */
    navLabel: z.string().optional(),
    description: z.string(),
    /** One line, used on the homepage grid. */
    short: z.string(),
    /** Sprite id from IconSprite.astro, e.g. "i-search". */
    icon: z.string(),
    includes: z.array(z.string()).default([]),
    faq: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .default([]),
    order: z.number().default(99),
  }),
});

const newsletter = defineCollection({
  loader: glob({ base: "./src/content/newsletter", pattern: "**/*.md" }),
  schema: z.object({
    /** The subject line. Written for an inbox, so it can differ from the title. */
    subject: z.string(),
    /** Heading on the web version of the issue. */
    title: z.string(),
    /** The grey line an inbox shows after the subject. Keep it under ~90 chars. */
    preheader: z.string().default(""),
    /** Meta description for the archived web version. */
    description: z.string(),
    pubDate: z.coerce.date(),
    /** Drafts build no page and no email artifact, so they cannot be sent. */
    draft: z.boolean().default(false),
  }),
});

const bootcamps = defineCollection({
  loader: glob({ base: "./src/content/bootcamps", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    /** Short label for nav and cards, when the full title is too long. */
    navLabel: z.string().optional(),
    /** Meta description, and the lede under the H1. */
    description: z.string(),
    /** One line, used on the /bootcamps/ card. */
    short: z.string(),
    /** The promise, above the fold. Longer and blunter than the title. */
    headline: z.string(),
    /** Sprite id from IconSprite.astro, e.g. "i-search". */
    icon: z.string().default("i-search"),
    /** Shown beside the price — "Self-paced", "6 weeks, live", and so on. */
    format: z.string(),
    /** schema.org courseWorkload — an ISO 8601 duration, e.g. "PT14H". */
    workload: z.string().optional(),
    /** What someone can do afterwards. Also becomes schema.org `teaches`. */
    outcomes: z.array(z.string()).default([]),
    /** Two honest lists. Saying who it does not suit is what makes the first one credible. */
    fit: z.array(z.string()).default([]),
    notFit: z.array(z.string()).default([]),
    modules: z
      .array(
        z.object({
          title: z.string(),
          summary: z.string(),
          lessons: z.array(z.string()).default([]),
        }),
      )
      .default([]),
    /** ISO 4217, applied to every tier. Kosovo runs on the euro. */
    currency: z.string().default("EUR"),
    tiers: z
      .array(
        z.object({
          name: z.string(),
          price: z.number(),
          /** Anything the number alone does not say — "per month", "+ VAT". */
          priceNote: z.string().optional(),
          summary: z.string(),
          features: z.array(z.string()).default([]),
          /** Ribbon across the top of the card, e.g. "MOST POPULAR". */
          badge: z.string().optional(),
          featured: z.boolean().default(false),
          /**
           * The hosted payment URL — a Paysera payment link, or whatever the
           * checkout ends up being. A tier without one is not on sale yet: its
           * button becomes a waitlist link and its Offer says PreOrder rather
           * than claiming stock that cannot be bought.
           */
          checkout: z.url().optional(),
        }),
      )
      .min(1),
    guarantee: z.string().optional(),
    testimonials: z
      .array(
        z.object({
          quote: z.string(),
          name: z.string(),
          role: z.string().optional(),
        }),
      )
      .default([]),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
    order: z.number().default(99),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, work, services, newsletter, bootcamps };
