// @ts-check
import { readdirSync, readFileSync } from "node:fs";
import { defineConfig, fontProviders } from "astro/config";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";

const BLOG_DIR = new URL("./src/content/blog/", import.meta.url);

/**
 * Real `lastmod` dates for the sitemap, keyed by pathname.
 *
 * Google schedules recrawls off `lastmod`, but only while it stays honest —
 * stamping every page with the build date is exactly what teaches a crawler to
 * ignore the field site-wide. So only pages backed by a genuine content date
 * get one, and the rest are left bare: a missing `lastmod` reads as "unknown",
 * not "never changed". (`changefreq` and `priority` are skipped entirely for
 * the same reason — Google discards both.)
 *
 * Frontmatter is read off disk because `getCollection` does not exist this
 * early in the build. Anything unparseable is skipped rather than guessed at.
 */
function blogLastmods() {
  const lastmods = new Map();
  const dates = [];

  for (const file of readdirSync(BLOG_DIR, { recursive: true })) {
    if (typeof file !== "string" || !file.endsWith(".md")) continue;

    const frontmatter = readFileSync(new URL(file, BLOG_DIR), "utf8").match(
      /^---\r?\n([\s\S]*?)\r?\n---/,
    )?.[1];
    if (!frontmatter) continue;

    // Drafts never render a page (see blog/[slug].astro), so they get no entry.
    if (/^draft:\s*true\s*$/m.test(frontmatter)) continue;

    const dateOf = (/** @type {string} */ field) =>
      frontmatter.match(new RegExp(`^${field}:\\s*["']?(\\d{4}-\\d{2}-\\d{2})`, "m"))?.[1];

    const date = dateOf("updatedDate") ?? dateOf("pubDate");
    if (!date) continue;

    lastmods.set(`/blog/${file.slice(0, -".md".length)}/`, date);
    dates.push(date);
  }

  // The index genuinely changes whenever a post is published or updated.
  if (dates.length > 0) lastmods.set("/blog/", dates.sort().at(-1));

  return lastmods;
}

const LASTMODS = blogLastmods();
const IS_VERCEL = process.env.VERCEL === "1";

export default defineConfig({
  site: "https://kastriottanaj.com",

  // Static by default: every page is HTML on disk at build time. The single
  // exception is src/pages/api/lead.ts, which opts out with `prerender = false`.
  output: "static",

  // Caddy serves dist/client directly; this server handles /api/* only.
  adapter: IS_VERCEL ? vercel() : node({ mode: "standalone" }),

  integrations: [
    sitemap({
      filter: (page) => !page.includes("/thanks"),
      serialize(item) {
        const lastmod = LASTMODS.get(new URL(item.url).pathname);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],

  // Downloaded and self-hosted at build time — no request to fonts.googleapis.com,
  // and Astro emits the preload link plus a metric-matched fallback.
  fonts: [
    {
      name: "Archivo",
      cssVariable: "--font-archivo",
      provider: fontProviders.google(),
      weights: [400, 600, 800],
      styles: ["normal"],
      subsets: ["latin", "latin-ext"],
      fallbacks: ["system-ui", "sans-serif"],
    },
  ],

  build: {
    inlineStylesheets: "auto",
  },

  security: {
    // Astro rejects cross-origin form POSTs by comparing the Origin header to
    // the URL it reconstructs. Behind Caddy the socket is plain HTTP, so
    // without this the reconstructed origin is http://… , the browser sends
    // https://… , and every real submission 403s. Listing the domains here is
    // what makes X-Forwarded-Proto trusted.
    checkOrigin: true,
    allowedDomains: [
      { hostname: "kastriottanaj.com", protocol: "https" },
      { hostname: "www.kastriottanaj.com", protocol: "https" },
    ],
  },
});
