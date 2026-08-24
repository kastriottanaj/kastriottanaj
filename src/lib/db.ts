import { getDb } from "./sqlite.mjs";

/**
 * Durable copy of every lead. Email is a notification, not a datastore — a
 * bounce or a spam folder must not be the difference between having a client
 * and never knowing they wrote.
 *
 * The connection itself lives in sqlite.mjs, shared with the newsletter store.
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

let schemaReady = false;

/** Creates the leads table on first write, never at build time. */
function leadsDb() {
  const db = getDb();
  if (schemaReady) return db;

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

  schemaReady = true;
  return db;
}

/** Returns the new row id, so the email step can mark it delivered. */
export function saveLead(lead: Lead): number {
  const statement = leadsDb().prepare(`
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
  leadsDb().prepare("UPDATE leads SET emailed = 1 WHERE id = ?").run(id);
}
