import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * Durable copy of every lead. Email is a notification, not a datastore — a
 * bounce or a spam folder must not be the difference between having a client
 * and never knowing they wrote.
 *
 * node:sqlite is built into Node, so there is no native module to compile. That
 * matters here: the build runs on the same ARM box that serves the site.
 */

export interface Lead {
  name: string;
  email: string;
  service: string;
  message: string;
  ip: string | null;
  userAgent: string | null;
  referer: string | null;
}

const DB_PATH = resolve(process.env.LEADS_DB_PATH ?? "./data/leads.db");

let db: DatabaseSync | null = null;

/** Opened on first write, never at build time. */
function getDb(): DatabaseSync {
  if (db) return db;

  mkdirSync(dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH);

  // WAL keeps the reader (a future admin view) from blocking the writer.
  db.exec("PRAGMA journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      name       TEXT NOT NULL,
      email      TEXT NOT NULL,
      service    TEXT NOT NULL,
      message    TEXT NOT NULL,
      ip         TEXT,
      user_agent TEXT,
      referer    TEXT,
      emailed    INTEGER NOT NULL DEFAULT 0
    )
  `);
  db.exec("CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC)");

  return db;
}

/** Returns the new row id, so the email step can mark it delivered. */
export function saveLead(lead: Lead): number {
  const statement = getDb().prepare(`
    INSERT INTO leads (name, email, service, message, ip, user_agent, referer)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = statement.run(
    lead.name,
    lead.email,
    lead.service,
    lead.message,
    lead.ip,
    lead.userAgent,
    lead.referer
  );

  return Number(result.lastInsertRowid);
}

export function markEmailed(id: number): void {
  getDb().prepare("UPDATE leads SET emailed = 1 WHERE id = ?").run(id);
}
