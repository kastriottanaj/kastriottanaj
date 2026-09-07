#!/usr/bin/env node
//
// Generate the JPEG share cards that og:image points at.
//
//   npm run og:images
//
// Why the cards exist at all is in src/lib/og.mjs: LinkedIn's crawler will not
// open a WebP, and every hero here is WebP.
//
// Why this is a hand-run script and not a build step: sharp is a native module
// that arrives as a transitive dependency of Astro, and the build runs on the
// ARM box during deploy. Wiring share cards to that means the day sharp fails
// to install, every card on the site quietly disappears — and nobody notices,
// because the pages still render. Generating them here and committing the JPEGs
// makes them ordinary files that either exist in the repo or do not. src/lib/og.mjs
// fails the build when one is missing, so the two cannot drift apart silently.
//
// Blog cards are discovered from frontmatter, so a new post needs nothing here.
// The rest are page heroes that live as constants inside .astro files, and are
// listed below because there is no honest way to read them out.

import { readdirSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { OG_WIDTH, OG_HEIGHT, shareCardPath } from "../src/lib/og.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PUBLIC = join(ROOT, "public");

/** Page heroes passed to <Base image="..."> from inside a .astro file. */
const PAGE_CARDS = [
  "/assets/ai-seo.webp", // SITE.ogImage — the fallback every other page uses
  "/assets/about/kastriot-about-hero.webp",
  "/assets/blog/kastriot-tanaj-blog.webp",
  "/assets/bootcamps/hero-course.webp",
  "/assets/bootcamps/kastriot-tanaj-seo-bootcamp.webp",
  "/assets/bootcamps/kastriot-tanaj-wordpress-bootcamp.webp",
  "/assets/contact/kastriot-tanaj-contact.webp",
  "/assets/newsletter/kastriot-tanaj-newsletter.webp",
  "/assets/pricing/seo-automation-packages.webp",
  "/assets/process/process-kastriot-tanaj.webp",
  "/assets/services/kastriot-tanaj-services.webp",
  "/assets/services/kastriot-tanaj-seo-services.webp",
  "/assets/services/kastriot-tanaj-ai-automation-services.webp",
  "/assets/services/kastriot-tanaj-digital-marketing-services.webp",
  "/assets/services/kastriot-tanaj-web-development-services.webp",
  "/assets/work/faralda-crane-hotel-amsterdam.webp",
  // /northbound/ is its own brand with its own <head> — its card comes from the
  // hero video's poster, the only still the page has.
  "/video/shkoder-poster.jpg",
  // Case-study evidence. Wide, thin exports rather than art, so they letterbox
  // rather than crop — see `fit` below.
  "/assets/sts-evidence/organic-traffic.jpg",
  "/assets/gerti-evidence/gsc-performance-28d.jpg",
  "/assets/as-real-estate-evidence/performance.jpg",
];

/** The off-white the site sits on, so a letterboxed card matches the page. */
const MATTE = { r: 243, g: 242, b: 242 };

/** Card art from src/content/blog/*.md — one `image:` per post, at most. */
function blogCards() {
  const dir = join(ROOT, "src/content/blog");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => readFileSync(join(dir, f), "utf8").match(/^image:\s*"([^"]+)"/m)?.[1])
    .filter((src) => src !== undefined);
}

const TARGET_ASPECT = OG_WIDTH / OG_HEIGHT;

/**
 * Crop art, letterbox exports.
 *
 * A hero shot at 16:9 or 3:2 loses nothing worth keeping when it is cropped to
 * 1.91:1, and a full-bleed card looks better than one sitting in bars. A Search
 * Console screenshot is 3:1 and every pixel of it is the evidence — cropping
 * one to fit throws away the half of the chart that makes the point. 1.4x off
 * the target shape is where art stops and exports start.
 */
function fitFor(width, height) {
  const ratio = width / height / TARGET_ASPECT;
  return ratio > 1.4 || ratio < 1 / 1.4 ? "contain" : "cover";
}

const sources = [...new Set([...PAGE_CARDS, ...blogCards()])].sort();
let written = 0;
let failed = 0;

for (const src of sources) {
  const from = join(PUBLIC, src.replace(/^\//, ""));
  const to = join(PUBLIC, shareCardPath(src).replace(/^\//, ""));

  if (!existsSync(from)) {
    console.error(`  missing source  ${src}`);
    failed += 1;
    continue;
  }

  const { width, height } = await sharp(from).metadata();
  const fit = fitFor(width, height);

  if (width < OG_WIDTH || height < OG_HEIGHT) {
    console.warn(`  upscaling ${width}x${height}  ${src} — the card will be soft`);
  }

  mkdirSync(dirname(to), { recursive: true });
  await sharp(from)
    .resize(OG_WIDTH, OG_HEIGHT, { fit, background: MATTE, kernel: "lanczos3" })
    // Flattened because a JPEG has no alpha, and an unflattened PNG with
    // transparency comes out black rather than off-white.
    .flatten({ background: MATTE })
    .jpeg({ quality: 82, mozjpeg: true, progressive: true })
    .toFile(to);

  console.log(`  ${fit.padEnd(7)} ${String(width).padStart(4)}x${String(height).padEnd(4)} -> ${shareCardPath(src)}`);
  written += 1;
}

console.log(`\n${written} share card${written === 1 ? "" : "s"} written to public/og/.`);

if (failed > 0) {
  console.error(`${failed} source${failed === 1 ? "" : "s"} missing — those pages have no card.`);
  process.exit(1);
}
