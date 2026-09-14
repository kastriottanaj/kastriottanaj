#!/usr/bin/env node
//
// Fail the build when the HTML outgrows the Content Security Policy.
//
//   node scripts/check-csp.mjs [dist-dir]
//
// deploy/Caddyfile allows inline scripts by SHA-256 hash, because Caddy serves
// the HTML from disk and cannot mint a nonce per response. That makes the
// policy a snapshot of the inline scripts the build shipped on the day it was
// written: change the consent snippet, the Meta Pixel stub or the homepage
// video script — or let Astro inline a hoisted script that used to be small
// enough to bundle — and the hash in the header no longer matches. Under an
// enforced policy the browser refuses the script and nothing visibly breaks:
// analytics simply stop.
//
// So, as with the sitemap check, assert the invariant against what was built:
// every inline script in dist has its hash in script-src, every external script
// host is allowed, and nothing ships that a hash-based policy cannot express —
// on* handler attributes and javascript: URLs. A miss prints the hash to add.
//
// Runs in CI after the build, where a non-zero exit blocks the deploy.

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const dist = process.argv[2] ?? "dist/client";
const caddyfile = "deploy/Caddyfile";

if (!existsSync(dist)) {
  console.error(`csp check: no build at ${dist} — run \`npm run build\` first.`);
  process.exit(1);
}

/* Either header name — the policy is report-only until it has been watched in
   the wild, and the check has to hold it to the same standard either way. */
const policy = readFileSync(caddyfile, "utf8").match(
  /^\s*Content-Security-Policy(?:-Report-Only)?\s+"([^"]+)"/m,
)?.[1];
if (!policy) {
  console.error(`csp check: no Content-Security-Policy header found in ${caddyfile}.`);
  process.exit(1);
}

const directives = new Map(
  policy
    .split(";")
    .map((d) => d.trim().split(/\s+/))
    .map(([name, ...sources]) => [name, sources]),
);
const scriptSrc = directives.get("script-src") ?? directives.get("default-src") ?? [];
const hashes = new Set(scriptSrc.filter((s) => s.startsWith("'sha256-")).map((s) => s.slice(1, -1)));
const hosts = scriptSrc.filter((s) => /^https?:\/\//.test(s));

/** Every file under dir. */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const pages = walk(dist).filter((f) => f.endsWith(".html"));
const routeOf = (file) => "/" + relative(dist, file).split(sep).join("/");

/* The CSP hash is over the exact bytes between the tags — whitespace included. */
const sha256 = (body) => "sha256-" + createHash("sha256").update(body).digest("base64");

const hostAllowed = (url) => {
  const { hostname } = new URL(url);
  return hosts.some((h) => {
    const allowed = new URL(h).hostname;
    return allowed.startsWith("*.")
      ? hostname.endsWith(allowed.slice(1))
      : hostname === allowed;
  });
};

const problems = [];
const inline = new Map(); // hash -> { pages, head }
let externalTags = 0;

for (const file of pages) {
  const html = readFileSync(file, "utf8");
  const route = routeOf(file);

  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const [, attrs, body] = match;
    // JSON-LD is data, not a script the CSP runs.
    if (/type=["']application\/ld\+json["']/i.test(attrs)) continue;

    const src = attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (src) {
      externalTags++;
      if (/^https?:\/\//.test(src) && !hostAllowed(src)) {
        problems.push(`${route}: external script host not in script-src — ${src}`);
      }
      continue;
    }

    const hash = sha256(body);
    const seen = inline.get(hash) ?? { pages: new Set(), head: body.trim().slice(0, 60).replace(/\s+/g, " ") };
    seen.pages.add(route);
    inline.set(hash, seen);
  }

  for (const match of html.matchAll(/<[a-z][^>]*\s(on[a-z]+)=/gi)) {
    problems.push(`${route}: ${match[1]}= handler attribute — a hash policy cannot allow it`);
  }
  for (const match of html.matchAll(/(?:href|src|action)=["']javascript:/gi)) {
    problems.push(`${route}: ${match[0]}… URL — blocked by the policy`);
  }
}

for (const [hash, { pages: on, head }] of inline) {
  if (!hashes.has(hash)) {
    problems.push(
      `inline script on ${on.size} page${on.size > 1 ? "s" : ""} (${[...on][0]}${on.size > 1 ? ", …" : ""}) ` +
        `has no hash in script-src — add '${hash}' for: ${head}…`,
    );
  }
}

/* The other way round is not an error, but say so: a hash nothing uses any
   more is a stale allowance and should go. */
const stale = [...hashes].filter((h) => !inline.has(h));

if (problems.length) {
  console.error(`csp check: ${problems.length} problem${problems.length > 1 ? "s" : ""}\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error(`\nUpdate ${caddyfile}, then install it on the server — see deploy/deploy.sh.`);
  process.exit(1);
}

console.log(
  `csp check: ${pages.length} pages — ${inline.size} inline script${inline.size === 1 ? "" : "s"} hashed, ` +
    `${externalTags} external script tags allowed` +
    (stale.length ? `; ${stale.length} unused hash${stale.length > 1 ? "es" : ""} could be dropped: ${stale.join(", ")}` : "."),
);
