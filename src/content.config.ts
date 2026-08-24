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

export const collections = { blog, work, services, newsletter };
