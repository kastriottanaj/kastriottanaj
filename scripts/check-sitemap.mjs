#!/usr/bin/env node
//
// Fail the build when a page ships without a sitemap entry.
//
//   node scripts/check-sitemap.mjs [dist-dir]
//
// The collection sitemaps build themselves — sitemap-blog.xml and its siblings
// call getCollection(), so a new .md under src/content/ is listed the moment it
// exists. sitemap-pages.xml is different: it is a hand-written list, because
// the homepage carries curated <video> metadata that cannot be derived from a
// route. That hand-written list is the thing a new landing page gets forgotten
// in, and a page missing from the sitemap is invisible in the one place it
// costs the most.
//
// So rather than guess which new pages belong in a sitemap, this asserts the
// invariant against what was actually built: every page is either listed in a
// sitemap, or marked noindex on purpose. Both are fine. Neither is not.
//
// It also catches the opposite mistake — a sitemap pointing at a URL that no
// longer builds, which sends crawlers to a 404.
//
// llms.txt gets the same treatment. Its collection sections build themselves
// too, but the static pages in it are hand-listed just like sitemap-pages.xml,
// and it is the file a model reads first — a page missing from it is the page
// no model will cite. So: every sitemap URL must appear in llms.txt, and every
// internal link in llms.txt and llms-full.txt must be a page that built.
//
// Runs in CI after the build, where a non-zero exit blocks the deploy.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const dist = process.argv[2] ?? "dist/client";

if (!existsSync(dist)) {
  console.error(`sitemap check: no build at ${dist} — run \`npm run build\` first.`);
  process.exit(1);
}

/** Every file under dir, as paths relative to it. */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(dist);

// dist/client/blog/seo-and-geo/index.html -> /blog/seo-and-geo/
const routeOf = (file) => {
  const rel = relative(dist, file).split(sep).join("/");
  return "/" + rel.slice(0, -"index.html".length);
};

// 404.html is not an index.html, so it never enters this list — which is what
// we want: it is a real page that must stay out of the sitemap.
const pages = files.filter((f) => f.endsWith("index.html"));

const built = new Map(
  pages.map((file) => [routeOf(file), readFileSync(file, "utf8")]),
);

const isNoindex = (html) =>
  /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html);

// Every <loc> across every sitemap, including the index's children.
const sitemaps = files.filter((f) => /sitemap-.*\.xml$|sitemap-index\.xml$/.test(f));
const listed = new Set();
let origin = "";
for (const file of sitemaps) {
  for (const match of readFileSync(file, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)) {
    origin ||= match[1].match(/^https?:\/\/[^/]+/)?.[0] ?? "";
    listed.add(match[1].replace(/^https?:\/\/[^/]+/, ""));
  }
}

const problems = [];

// 1. An indexable page that no sitemap mentions.
for (const [route, html] of built) {
  if (listed.has(route) || isNoindex(html)) continue;
  problems.push(
    `  ${route}\n` +
      `      built and indexable, but in no sitemap.\n` +
      `      Add it to src/pages/sitemap-pages.xml.ts, or mark the page noindex if it should not rank.`,
  );
}

// 2. A sitemap entry with nothing behind it. The index lists the other sitemap
//    files themselves, so a <loc> is also satisfied by a built .xml.
const builtXml = new Set(
  files
    .filter((f) => f.endsWith(".xml"))
    .map((f) => "/" + relative(dist, f).split(sep).join("/")),
);
for (const route of listed) {
  if (built.has(route) || builtXml.has(route)) continue;
  problems.push(`  ${route}\n      listed in a sitemap, but nothing builds at that URL.`);
}

// 3. llms.txt must mention every URL the sitemaps do. Only the sitemaps'
//    page URLs count — the .xml children of sitemap-index are not pages.
const internalLinks = (file) => {
  const text = readFileSync(file, "utf8");
  const found = new Set();
  // Markdown links: root-relative, or absolute on this site's own origin.
  // Anything on another host (LinkedIn, Facebook …) is not ours to check.
  for (const m of text.matchAll(/\]\((https?:\/\/[^/)]+)?(\/[^)\s]*)\)/g)) {
    if (!m[1] || m[1] === origin) found.add(m[2]);
  }
  // Bare "Source: https://…/path/" lines in llms-full.txt.
  for (const m of text.matchAll(/^Source: (https?:\/\/[^/\s]+)(\/\S*)$/gm)) {
    if (m[1] === origin) found.add(m[2]);
  }
  return found;
};

const llms = join(dist, "llms.txt");
const llmsFull = join(dist, "llms-full.txt");

if (!existsSync(llms)) {
  problems.push(`  /llms.txt\n      did not build.`);
} else {
  const mentioned = internalLinks(llms);
  for (const route of listed) {
    if (builtXml.has(route) || mentioned.has(route)) continue;
    problems.push(
      `  ${route}\n` +
        `      in a sitemap, but not in llms.txt.\n` +
        `      Add it to src/pages/llms.txt.ts so models can find it.`,
    );
  }
}

// 4. Neither llms file may link to a page that does not build.
for (const file of [llms, llmsFull]) {
  if (!existsSync(file)) continue;
  const name = "/" + relative(dist, file);
  for (const route of internalLinks(file)) {
    if (built.has(route) || builtXml.has(route) || route === "/llms.txt" || route === "/llms-full.txt")
      continue;
    problems.push(`  ${route}\n      linked from ${name}, but nothing builds at that URL.`);
  }
}

if (problems.length > 0) {
  console.error(`\nsitemap check failed — ${problems.length} problem(s):\n`);
  console.error(problems.sort().join("\n"));
  console.error("");
  process.exit(1);
}

const noindexed = [...built.values()].filter(isNoindex).length;
console.log(
  `sitemap check: ${built.size} pages — ${built.size - noindexed} in sitemaps and llms.txt, ${noindexed} noindex by design.`,
);
