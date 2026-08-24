import { randomBytes } from "node:crypto";
import { getDb } from "./sqlite.mjs";

/**
 * Newsletter subscribers, and a log of who has been sent which issue.
 *
 * Double opt-in throughout: a row starts as `pending` and only becomes
 * `confirmed` when the address itself clicks the link. Nothing is ever sent to
 * a pending or unsubscribed row, which is what keeps the list — and the
 * kastriottanaj.com sending domain — clean.
 *
 * Plain JavaScript so scripts/send-newsletter.mjs can import it under bare node.
 */

/** Two separate secrets: an unsubscribe link lives in every issue forever, and
 *  should never double as a credential that can re-confirm an address. */
const TOKEN_BYTES = 24;

/** How long before a repeated "subscribe" resends the confirmation mail. Stops
 *  the form being used to mailbomb a third party one submission at a time. */
const RESEND_COOLDOWN_MINUTES = 15;

let schemaReady = false;

function db() {
  const database = getDb();
  if (schemaReady) return database;

  database.exec(`
    CREATE TABLE IF NOT EXISTS subscribers (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      email             TEXT NOT NULL UNIQUE,
      status            TEXT NOT NULL DEFAULT 'pending',
      confirm_token     TEXT NOT NULL,
      unsubscribe_token TEXT NOT NULL,
      created_at        TEXT NOT NULL DEFAULT (datetime('now')),
      confirm_sent_at   TEXT,
      confirmed_at      TEXT,
      unsubscribed_at   TEXT,
      source            TEXT,
      ip                TEXT,
      user_agent        TEXT
    )
  `);
  database.exec("CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers (status)");

  // One row per (issue, subscriber). The UNIQUE constraint is what makes a
  // re-run of an interrupted send resume instead of sending twice.
  database.exec(`
    CREATE TABLE IF NOT EXISTS newsletter_sends (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      issue         TEXT NOT NULL,
      subscriber_id INTEGER NOT NULL,
      sent_at       TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (issue, subscriber_id)
    )
  `);

  schemaReady = true;
  return database;
}

/** Lowercased and trimmed — the address is the unique key, so "A@b.com" and
 *  "a@b.com" must not become two subscriptions. */
export function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function token() {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/**
 * @typedef {object} SubscribeResult
 * @property {"created" | "resent" | "cooldown" | "already_confirmed"} outcome
 * @property {string | null} confirmToken Present only when a mail should go out.
 */

/**
 * Records the intent to subscribe. Never sends anything itself — the caller
 * decides, based on `outcome`, whether a confirmation mail is warranted.
 *
 * @param {{ email: string, source?: string | null, ip?: string | null, userAgent?: string | null }} input
 * @returns {SubscribeResult}
 */
export function subscribe({ email, source = null, ip = null, userAgent = null }) {
  const address = normalizeEmail(email);
  const database = db();

  const existing = database
    .prepare("SELECT id, status, confirm_token, confirm_sent_at FROM subscribers WHERE email = ?")
    .get(address);

  if (!existing) {
    const confirmToken = token();
    database
      .prepare(
        `INSERT INTO subscribers (email, confirm_token, unsubscribe_token, confirm_sent_at, source, ip, user_agent)
         VALUES (?, ?, ?, datetime('now'), ?, ?, ?)`
      )
      .run(address, confirmToken, token(), source, ip, userAgent);

    return { outcome: "created", confirmToken };
  }

  if (existing.status === "confirmed") {
    // Deliberately silent: mailing "you are already subscribed" to an address
    // someone else typed is still mail that address did not ask for.
    return { outcome: "already_confirmed", confirmToken: null };
  }

  const cooling = database
    .prepare(
      `SELECT 1 FROM subscribers
       WHERE id = ? AND confirm_sent_at IS NOT NULL
         AND confirm_sent_at > datetime('now', ?)`
    )
    .get(existing.id, `-${RESEND_COOLDOWN_MINUTES} minutes`);

  if (cooling) return { outcome: "cooldown", confirmToken: null };

  // Pending or previously unsubscribed: issue a fresh token and start over, so
  // an old link from a forwarded mail cannot be replayed.
  const confirmToken = token();
  database
    .prepare(
      `UPDATE subscribers
       SET status = 'pending', confirm_token = ?, confirm_sent_at = datetime('now'),
           unsubscribed_at = NULL, source = COALESCE(?, source), ip = ?, user_agent = ?
       WHERE id = ?`
    )
    .run(confirmToken, source, ip, userAgent, existing.id);

  return { outcome: "resent", confirmToken };
}

/**
 * Turns a pending row into a confirmed one. Idempotent: clicking the link twice
 * is a normal thing for people to do, and the second click must not read as an
 * error. Returns null only when the token matches nothing.
 *
 * @param {string} confirmToken
 * @returns {{ email: string, unsubscribeToken: string, firstConfirmation: boolean } | null}
 */
export function confirmSubscriber(confirmToken) {
  if (!confirmToken) return null;
  const database = db();

  const row = database
    .prepare("SELECT id, email, status, unsubscribe_token FROM subscribers WHERE confirm_token = ?")
    .get(confirmToken);

  if (!row) return null;

  const firstConfirmation = row.status !== "confirmed";
  if (firstConfirmation) {
    database
      .prepare(
        `UPDATE subscribers
         SET status = 'confirmed', confirmed_at = datetime('now'), unsubscribed_at = NULL
         WHERE id = ?`
      )
      .run(row.id);
  }

  return {
    email: String(row.email),
    unsubscribeToken: String(row.unsubscribe_token),
    firstConfirmation,
  };
}

/**
 * @param {string} unsubscribeToken
 * @returns {boolean} false only when the token matches no row.
 */
export function unsubscribe(unsubscribeToken) {
  if (!unsubscribeToken) return false;

  const result = db()
    .prepare(
      `UPDATE subscribers
       SET status = 'unsubscribed', unsubscribed_at = datetime('now')
       WHERE unsubscribe_token = ?`
    )
    .run(unsubscribeToken);

  return Number(result.changes) > 0;
}

/**
 * Everyone who should receive `issue`, skipping anyone already sent it — so an
 * interrupted send is resumed by simply running it again.
 *
 * @param {string} issue
 * @returns {{ id: number, email: string, unsubscribe_token: string }[]}
 */
export function recipientsFor(issue) {
  return /** @type {any[]} */ (
    db()
      .prepare(
        `SELECT s.id, s.email, s.unsubscribe_token
         FROM subscribers s
         WHERE s.status = 'confirmed'
           AND NOT EXISTS (
             SELECT 1 FROM newsletter_sends n WHERE n.issue = ? AND n.subscriber_id = s.id
           )
         ORDER BY s.id`
      )
      .all(issue)
  );
}

/** @param {string} issue @param {number} subscriberId */
export function recordSend(issue, subscriberId) {
  db()
    .prepare("INSERT OR IGNORE INTO newsletter_sends (issue, subscriber_id) VALUES (?, ?)")
    .run(issue, subscriberId);
}

/** @returns {{ confirmed: number, pending: number, unsubscribed: number }} */
export function listStats() {
  const rows = /** @type {any[]} */ (
    db().prepare("SELECT status, COUNT(*) AS count FROM subscribers GROUP BY status").all()
  );

  const stats = { confirmed: 0, pending: 0, unsubscribed: 0 };
  for (const row of rows) {
    if (row.status in stats) stats[row.status] = Number(row.count);
  }
  return stats;
}
