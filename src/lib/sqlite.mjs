import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * The one SQLite connection, shared by the lead store and the newsletter store.
 *
 * Plain JavaScript rather than TypeScript on purpose: scripts/send-newsletter.mjs
 * imports this straight from node, with no build step in between. Everything
 * that touches it from Astro is still type-checked through JSDoc.
 *
 * One file, one connection: the nightly backup (deploy/backup-leads.sh) then
 * covers subscribers as well as leads without knowing they exist.
 */

const DB_PATH = resolve(process.env.LEADS_DB_PATH ?? "./data/leads.db");

/** @type {DatabaseSync | null} */
let db = null;

/**
 * Opened on first use, never at build time.
 * @returns {DatabaseSync}
 */
export function getDb() {
  if (db) return db;

  mkdirSync(dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH);

  // WAL keeps a reader (the send script, a future admin view) from blocking the
  // writer, which matters now that a newsletter send reads while /api/subscribe
  // may be writing.
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA busy_timeout = 5000");

  return db;
}

/** Where the database lives — surfaced so scripts can report it. */
export const databasePath = DB_PATH;
