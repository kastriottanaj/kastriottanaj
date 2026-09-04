#!/usr/bin/env node
//
// Is this box actually talking to MailerLite?
//
//   node scripts/mailerlite-check.mjs
//
// Reads nothing, writes nothing, sends nothing. It calls the API once with the
// key in the environment and prints what came back, which answers the three
// questions worth asking before trusting a signup form to a service you just
// connected: is the key live, which groups exist, and is the one this site
// pushes to among them.
//
// On the server:
//
//   cd /var/www/kastriottanaj/current
//   set -a && source /etc/kastriottanaj/env && set +a
//   node scripts/mailerlite-check.mjs

import { listGroups, mailerliteConfigured, mailerliteOwnsOptIn } from "../src/lib/mailerlite.mjs";

if (!mailerliteConfigured()) {
  console.error("\n  MAILERLITE_API_KEY is not set — the site is running on its own list.");
  console.error("  Add it to /etc/kastriottanaj/env, then restart: systemctl restart kastriottanaj\n");
  process.exit(1);
}

const configured = String(process.env.MAILERLITE_GROUP_ID ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const result = await listGroups();

if (!result.ok) {
  console.error(`\n  MailerLite refused the key (${result.error}).`);
  if (result.error === "http_401") {
    console.error("  401 means the token is wrong, revoked, or belongs to a deleted user.");
    console.error("  Generate a new one: Integrations → MailerLite API → Generate new token.\n");
  } else {
    console.error("  Check the box has outbound HTTPS, then try again.\n");
  }
  process.exit(1);
}

console.log("\n  Key       accepted");
console.log(`  Opt-in    ${mailerliteOwnsOptIn() ? "MailerLite sends the confirmation mail" : "this site sends it (MAILERLITE_OPT_IN=site)"}`);
console.log(`  Groups    ${result.groups.length}\n`);

for (const group of result.groups) {
  const mark = configured.includes(group.id) ? "→" : " ";
  console.log(`  ${mark} ${group.id.padEnd(20)} ${group.name}`);
  console.log(`    ${" ".repeat(20)} ${group.active} active · ${group.unconfirmed} unconfirmed`);
}

console.log("");

if (!configured.length) {
  console.log("  MAILERLITE_GROUP_ID is not set. Subscribers will land ungrouped, and an");
  console.log("  automation triggered by \"subscriber joins a group\" will never fire.");
  console.log("  Copy an id from the list above into /etc/kastriottanaj/env.\n");
  process.exit(1);
}

const missing = configured.filter((id) => !result.groups.some((group) => group.id === id));
if (missing.length) {
  console.log(`  MAILERLITE_GROUP_ID names a group this account does not have: ${missing.join(", ")}`);
  console.log("  Every push will fail validation until it matches one of the ids above.\n");
  process.exit(1);
}

console.log("  Ready. Subscribe yourself from /newsletter/ and watch the dashboard.");
console.log("  If no confirmation mail arrives, the cause is almost always Account settings →");
console.log("  Subscribe settings → \"Double opt-in for API and integrations\" being off.\n");
