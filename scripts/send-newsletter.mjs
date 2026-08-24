#!/usr/bin/env node
//
// Send one issue of the newsletter to every confirmed subscriber.
//
//   node scripts/send-newsletter.mjs <slug> [options]
//
//   --dry-run        Render and count, send nothing. Always do this first.
//   --test <email>   Send only to that address, and record nothing.
//   --limit <n>      Stop after n recipients (a cautious first batch).
//   --rate <n>       Messages per minute. Default 20.
//
// Runs on the server, where the database and the built site both live:
//
//   cd /var/www/kastriottanaj/current
//   set -a && source /etc/kastriottanaj/env && set +a
//   node scripts/send-newsletter.mjs my-issue --dry-run
//
// The issue must be committed, have `draft: false`, and have been through a
// build — the body comes from dist/client/newsletter/email/<slug>.json, which
// is written by src/pages/newsletter/email/[slug].json.ts.
//
// Interrupted halfway? Run it again. Every delivery is written to
// newsletter_sends, and a rerun skips whoever already has it.

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { createTransport, FROM_ADDRESS } from "../src/lib/mailer.mjs";
import { buildIssueEmail } from "../src/lib/newsletter-email.mjs";
import { recipientsFor, recordSend, listStats } from "../src/lib/newsletter-store.mjs";
import { databasePath } from "../src/lib/sqlite.mjs";

const DIST = process.env.DIST_DIR ?? "./dist/client";

function parseArgs(argv) {
  const options = { slug: null, dryRun: false, test: null, limit: Infinity, rate: 20 };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--test") options.test = argv[++i];
    else if (arg === "--limit") options.limit = Number(argv[++i]);
    else if (arg === "--rate") options.rate = Number(argv[++i]);
    else if (arg.startsWith("-")) fail(`Unknown option: ${arg}`);
    else if (!options.slug) options.slug = arg;
    else fail(`Unexpected argument: ${arg}`);
  }

  if (!options.slug) fail("Usage: node scripts/send-newsletter.mjs <slug> [--dry-run] [--test you@example.com] [--limit n] [--rate n]");
  if (!Number.isFinite(options.rate) || options.rate <= 0) fail("--rate must be a positive number");
  if (Number.isNaN(options.limit)) fail("--limit must be a number");

  return options;
}

function fail(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

async function loadIssue(slug) {
  const path = resolve(DIST, "newsletter/email", `${slug}.json`);
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      fail(
        `No built issue at ${path}.\n` +
          `  Check that src/content/newsletter/${slug}.md exists, has draft: false, and that the site has been rebuilt.`
      );
    }
    throw error;
  }
}

const options = parseArgs(process.argv.slice(2));
const issue = await loadIssue(options.slug);

console.log(`\n  Issue    ${issue.slug}`);
console.log(`  Subject  ${issue.subject}`);
console.log(`  Web      ${issue.url}`);
console.log(`  From     ${FROM_ADDRESS}`);
console.log(`  Database ${databasePath}`);

// A test send goes to one address with a throwaway token: the link in it is
// deliberately dead, so clicking it cannot unsubscribe a real person.
const recipients = options.test
  ? [{ id: -1, email: options.test, unsubscribe_token: "test-token-not-in-database" }]
  : recipientsFor(issue.slug).slice(0, options.limit);

if (!options.test) {
  const stats = listStats();
  console.log(
    `  List     ${stats.confirmed} confirmed · ${stats.pending} unconfirmed · ${stats.unsubscribed} unsubscribed`
  );
}
console.log(`  Sending  ${recipients.length} message(s)${options.dryRun ? " (dry run)" : ""}\n`);

if (recipients.length === 0) {
  console.log("  Nobody to send to — everyone confirmed has already had this issue.\n");
  process.exit(0);
}

if (options.dryRun) {
  const sample = buildIssueEmail({ issue, unsubscribeToken: "sample-token" });
  console.log(`  Subject line : ${sample.subject}`);
  console.log(`  HTML part    : ${sample.html.length} bytes`);
  console.log(`  Text part    : ${sample.text.length} bytes`);
  console.log(`  First 5      : ${recipients.slice(0, 5).map((r) => r.email).join(", ")}`);
  console.log("\n  Dry run — nothing sent.\n");
  process.exit(0);
}

const transporter = createTransport();
if (!transporter) fail("SMTP is not configured. Set SMTP_PASSWORD (see .env.example).");

// Hostinger throttles a mailbox that fires everything at once, and a throttled
// mailbox looks like a compromised one. Pacing costs nothing on a list this size.
const gapMs = Math.ceil(60_000 / options.rate);

let sent = 0;
const failures = [];

for (const [index, recipient] of recipients.entries()) {
  const message = buildIssueEmail({ issue, unsubscribeToken: recipient.unsubscribe_token });

  try {
    await transporter.sendMail({ ...message, to: recipient.email });
    if (!options.test) recordSend(issue.slug, recipient.id);
    sent += 1;
    process.stdout.write(`  ✓ ${recipient.email}\n`);
  } catch (error) {
    failures.push({ email: recipient.email, reason: error?.message ?? String(error) });
    process.stdout.write(`  ✗ ${recipient.email} — ${error?.message ?? error}\n`);
  }

  if (index < recipients.length - 1) await sleep(gapMs);
}

transporter.close();

console.log(`\n  Sent ${sent} of ${recipients.length}.`);
if (failures.length) {
  console.log(`  ${failures.length} failed — they are not recorded, so running this again retries them:`);
  for (const failure of failures) console.log(`    ${failure.email}: ${failure.reason}`);
  process.exit(1);
}
console.log("");
