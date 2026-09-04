#!/usr/bin/env node
//
// Hand the existing list to MailerLite, once.
//
//   node scripts/mailerlite-sync.mjs [options]
//
//   --dry-run           List what would be sent, send nothing. Do this first.
//   --include-pending   Also push addresses that never confirmed here. With
//                       double opt-in for API on, MailerLite mails every one of
//                       them a confirmation — so only for a list that expects it.
//   --rate <n>          Requests per minute. Default 60 (the API allows 120).
//
// Everything already confirmed on this box goes over as `active`, carrying the
// date and the signup source it was collected with, so MailerLite shows a real
// subscription history rather than "imported today". Addresses that
// unsubscribed here go over as `unsubscribed`, which is the half people forget:
// an import without them is an import that mails people who already left.
//
// Idempotent. Re-running updates the same contacts instead of duplicating them,
// and `resubscribe` is never sent, so anyone who opted out inside MailerLite
// stays out no matter what this table says.
//
// On the server:
//
//   cd /var/www/kastriottanaj/current
//   set -a && source /etc/kastriottanaj/env && set +a
//   node scripts/mailerlite-sync.mjs --dry-run

import { setTimeout as sleep } from "node:timers/promises";
import { exportSubscribers, listStats } from "../src/lib/newsletter-store.mjs";
import { databasePath } from "../src/lib/sqlite.mjs";
import { mailerliteConfigured, mailerliteTimestamp, upsertSubscriber } from "../src/lib/mailerlite.mjs";

function fail(message) {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const options = { dryRun: false, includePending: false, rate: 60 };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--include-pending") options.includePending = true;
    else if (arg === "--rate") options.rate = Number(argv[++i]);
    else fail(`Unknown option: ${arg}`);
  }

  if (!Number.isFinite(options.rate) || options.rate <= 0) fail("--rate must be a positive number");
  return options;
}

/** Local statuses and MailerLite's are nearly the same word for the same thing;
 *  `pending` is the exception, because nobody here has proof of consent yet. */
const STATUS_MAP = { confirmed: "active", unsubscribed: "unsubscribed", pending: "unconfirmed" };

const options = parseArgs(process.argv.slice(2));

if (!mailerliteConfigured()) {
  fail("MAILERLITE_API_KEY is not set (see .env.example).");
}

const statuses = ["confirmed", "unsubscribed", ...(options.includePending ? ["pending"] : [])];
const subscribers = exportSubscribers({ statuses });
const stats = listStats();

console.log(`\n  Database  ${databasePath}`);
console.log(
  `  List      ${stats.confirmed} confirmed · ${stats.pending} unconfirmed · ${stats.unsubscribed} unsubscribed` +
    ` · ${stats.handedToMailerlite} already in MailerLite`
);
console.log(`  Group     ${process.env.MAILERLITE_GROUP_ID || "(none — subscribers land ungrouped)"}`);
console.log(`  Sending   ${subscribers.length} contact(s)${options.dryRun ? " (dry run)" : ""}\n`);

if (subscribers.length === 0) {
  console.log("  Nothing to sync.\n");
  process.exit(0);
}

if (options.dryRun) {
  for (const row of subscribers.slice(0, 10)) {
    console.log(`  ${STATUS_MAP[row.status].padEnd(12)} ${row.email}  ${row.source ?? ""}`);
  }
  if (subscribers.length > 10) console.log(`  … and ${subscribers.length - 10} more`);
  console.log("\n  Dry run — nothing sent.\n");
  process.exit(0);
}

const gapMs = Math.ceil(60_000 / options.rate);

let synced = 0;
const failures = [];

for (const [index, row] of subscribers.entries()) {
  const result = await upsertSubscriber({
    email: row.email,
    status: STATUS_MAP[row.status],
    source: row.source,
    ip: row.ip,
    // The signup date this site recorded, not today's — a MailerLite contact
    // whose history starts at the import is a contact you cannot segment by age.
    subscribedAt: mailerliteTimestamp(new Date(`${row.created_at}Z`)),
    optedInAt: row.confirmed_at ? mailerliteTimestamp(new Date(`${row.confirmed_at}Z`)) : null,
  });

  if (result.ok) {
    synced += 1;
    process.stdout.write(`  ✓ ${row.email}\n`);
  } else {
    failures.push({ email: row.email, reason: result.error ?? "unknown" });
    process.stdout.write(`  ✗ ${row.email} — ${result.error}\n`);
  }

  if (index < subscribers.length - 1) await sleep(gapMs);
}

console.log(`\n  Synced ${synced} of ${subscribers.length}.`);
if (failures.length) {
  console.log(`  ${failures.length} failed — the sync is idempotent, so run it again:`);
  for (const failure of failures) console.log(`    ${failure.email}: ${failure.reason}`);
  process.exit(1);
}
console.log("");
