#!/usr/bin/env node
//
// Fail the build when a page's share card is missing, unreadable or misdeclared.
//
//   node scripts/check-og-images.mjs [dist-dir]
//
// og:image is the one meta tag whose mistakes are invisible from the site. The
// page renders perfectly, the tag is present and well-formed, and the link still
// posts to LinkedIn as a bare grey box — because the file 404s, or because it is
// a WebP, which LinkedIn's crawler will not open. Nobody sees it until someone
// shares a post, and by then the post is out.
//
// So this asserts, against what was actually built, the three things that break:
//
//   1. the card exists at the URL the tag claims;
//   2. it is a JPEG or a PNG, not a WebP;
//   3. og:image:width and og:image:height match the file on disk — crawlers lay
//      the card out from those numbers before the image arrives, and wrong ones
//      produce a cropped or letterboxed preview.
//
// Runs in CI after the build, where a non-zero exit blocks the deploy.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const dist = process.argv[2] ?? "dist/client";

if (!existsSync(dist)) {
  console.error(`og:image check: no build at ${dist} — run \`npm run build\` first.`);
  process.exit(1);
}

/** Formats a crawler will open. WebP is the whole reason this check exists. */
const ALLOWED = new Set(["jpeg", "png"]);

/** Read intrinsic size straight from the file header — no image library here. */
function measure(file) {
  const buf = readFileSync(file);

  // PNG: IHDR is always the first chunk, width and height at a fixed offset.
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { format: "png", width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // JPEG: walk the marker segments to the start-of-frame, which carries the size.
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1];
      // SOF0..SOF15, minus the four that are not frame headers at all.
      const isFrame =
        marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc, 0xd8].includes(marker);
      if (isFrame) {
        return { format: "jpeg", height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }

  // RIFF....WEBP — named rather than rejected as junk, because it is the one
  // wrong answer this check is here to catch.
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return { format: "webp" };
  }

  return { format: "unknown" };
}

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return full.endsWith(".html") ? [full] : [];
  });
}

const tag = (html, property) =>
  html.match(new RegExp(`<meta[^>]+property="${property}"[^>]+content="([^"]*)"`))?.[1];

const problems = [];
let checked = 0;

for (const file of htmlFiles(dist)) {
  const page = "/" + relative(dist, file).split(sep).join("/");
  const html = readFileSync(file, "utf8");

  // A page held out of the index is not a page anyone is meant to share — the
  // redirect stubs in public/ are the reason this exemption exists.
  if (/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/.test(html)) continue;

  const image = tag(html, "og:image");
  if (image === undefined) {
    problems.push(`${page} — no og:image. Every page needs one, even if it is the site default.`);
    continue;
  }

  checked += 1;

  // Only our own cards are ours to verify; an absolute URL elsewhere is not.
  let path;
  try {
    const url = new URL(image);
    if (url.hostname !== "kastriottanaj.com") continue;
    path = url.pathname;
  } catch {
    problems.push(`${page} — og:image is not an absolute URL: ${image}`);
    continue;
  }

  const card = join(dist, path.replace(/^\//, ""));
  if (!existsSync(card)) {
    problems.push(
      `${page} — og:image 404s: ${path}\n` +
        `      Run \`npm run og:images\` and commit what it writes.`,
    );
    continue;
  }

  const { format, width, height } = measure(card);
  if (!ALLOWED.has(format)) {
    problems.push(
      `${page} — og:image is ${format}, which LinkedIn will not render: ${path}`,
    );
    continue;
  }

  const declared = { width: tag(html, "og:image:width"), height: tag(html, "og:image:height") };
  if (declared.width !== String(width) || declared.height !== String(height)) {
    problems.push(
      `${page} — og:image is ${width}x${height} but the tags say ` +
        `${declared.width}x${declared.height}: ${path}`,
    );
  }
}

if (problems.length > 0) {
  console.error(`og:image check: ${problems.length} problem(s).\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(`\nChecked ${checked} page(s).`);
  process.exit(1);
}

console.log(`og:image check: ${checked} page(s), every share card present and correctly sized.`);
