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
 *  the form being used to mailbomb a third party one submission at a time.
 *
 *  It only ever applies to an address still waiting to confirm: confirming
 *  clears confirm_sent_at, so someone who unsubscribes and changes their mind
 *  five minutes later gets a fresh link rather than silence. */
const RESEND_COOLDOWN_MINUTES = 15;
const CONFIRM_TOKEN_LIFETIME_HOURS = 48;

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

  // Added after the table already existed on the server, so it arrives as a
  // migration rather than a column in the CREATE above. It records the moment
  // an address was handed to MailerLite: from then on its real status lives
  // there, and a row here that says `pending` says nothing about consent.
  const columns = /** @type {any[]} */ (database.prepare("PRAGMA table_info(subscribers)").all());
  if (!columns.some((column) => column.name === "mailerlite_at")) {
    database.exec("ALTER TABLE subscribers ADD COLUMN mailerlite_at TEXT");
  }

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
 * @property {boolean} handedOff Whether this address has already been pushed to
 *   MailerLite — in which case its real status lives there, not in this row.
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
    .prepare(
      "SELECT id, status, confirm_token, confirm_sent_at, mailerlite_at FROM subscribers WHERE email = ?"
    )
    .get(address);

  if (!existing) {
    const confirmToken = token();
    database
      .prepare(
        `INSERT INTO subscribers (email, confirm_token, unsubscribe_token, confirm_sent_at, source, ip, user_agent)
         VALUES (?, ?, ?, datetime('now'), ?, ?, ?)`
      )
      .run(address, confirmToken, token(), source, ip, userAgent);

    return { outcome: "created", confirmToken, handedOff: false };
  }

  if (existing.status === "confirmed") {
    // Deliberately silent: mailing "you are already subscribed" to an address
    // someone else typed is still mail that address did not ask for.
    return { outcome: "already_confirmed", confirmToken: null, handedOff: Boolean(existing.mailerlite_at) };
  }

  const cooling = database
    .prepare(
      `SELECT 1 FROM subscribers
       WHERE id = ? AND confirm_sent_at IS NOT NULL
         AND confirm_sent_at > datetime('now', ?)`
    )
    .get(existing.id, `-${RESEND_COOLDOWN_MINUTES} minutes`);

  if (cooling) return { outcome: "cooldown", confirmToken: null, handedOff: Boolean(existing.mailerlite_at) };

  // Pending or previously unsubscribed: issue fresh tokens and start over, so
  // links from an old or forwarded mail cannot change the new subscription.
  const confirmToken = token();
  const unsubscribeToken = token();
  database
    .prepare(
      `UPDATE subscribers
       SET status = 'pending', confirm_token = ?, unsubscribe_token = ?, confirm_sent_at = datetime('now'),
           unsubscribed_at = NULL, source = COALESCE(?, source), ip = ?, user_agent = ?
       WHERE id = ?`
    )
    .run(confirmToken, unsubscribeToken, source, ip, userAgent, existing.id);

  return { outcome: "resent", confirmToken, handedOff: Boolean(existing.mailerlite_at) };
}

/**
 * Turns a pending row into a confirmed one. Idempotent: clicking the link twice
 * is a normal thing for people to do, and the second click must not read as an
 * error. Returns null only when the token matches nothing.
 *
 * @param {string} confirmToken
 * @returns {{ email: string, source: string | null, unsubscribeToken: string, firstConfirmation: boolean } | null}
 */
export function confirmSubscriber(confirmToken) {
  if (!confirmToken) return null;
  const database = db();

  const row = database
    .prepare(
      `SELECT id, email, status, source, unsubscribe_token
       FROM subscribers
       WHERE confirm_token = ?
         AND (status = 'confirmed' OR confirm_sent_at >= datetime('now', ?))`
    )
    .get(confirmToken, `-${CONFIRM_TOKEN_LIFETIME_HOURS} hours`);

  if (!row) return null;

  const firstConfirmation = row.status !== "confirmed";
  if (firstConfirmation) {
    database
      .prepare(
        `UPDATE subscribers
         SET status = 'confirmed', confirmed_at = datetime('now'),
             unsubscribed_at = NULL, confirm_sent_at = NULL
         WHERE id = ?`
      )
      .run(row.id);
  }

  return {
    email: String(row.email),
    source: row.source == null ? null : String(row.source),
    unsubscribeToken: String(row.unsubscribe_token),
    firstConfirmation,
  };
}

/**
 * Returns the address that was removed, so the caller can carry the opt-out to
 * MailerLite as well — a link in a mail sent from here must silence the list
 * everywhere, not just in this table.
 *
 * @param {string} unsubscribeToken
 * @returns {string | null} null only when the token matches no row.
 */
export function unsubscribe(unsubscribeToken) {
  if (!unsubscribeToken) return null;
  const database = db();

  const row = database
    .prepare("SELECT id, email FROM subscribers WHERE unsubscribe_token = ?")
    .get(unsubscribeToken);

  if (!row) return null;

  database
    .prepare(
      `UPDATE subscribers
       SET status = 'unsubscribed', unsubscribed_at = datetime('now')
       WHERE id = ?`
    )
    .run(row.id);

  return String(row.email);
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

/**
 * Stamps an address as handed to MailerLite. Nothing else reads this yet — it
 * exists so the local table can be told apart later: an old row still pending
 * because nobody clicked our link, versus one whose confirmation happened in
 * MailerLite and was never mirrored back.
 *
 * @param {string} email
 */
export function markHandedOff(email) {
  db()
    .prepare("UPDATE subscribers SET mailerlite_at = datetime('now') WHERE email = ?")
    .run(normalizeEmail(email));
}

/**
 * The whole table, oldest first — for handing the list to MailerLite once, and
 * for anything else that needs to read it out rather than mail it.
 *
 * A `pending` row that has already been handed over is left out on purpose:
 * MailerLite holds the only true status for it, and pushing it again as
 * `unconfirmed` would demote a contact who has since confirmed there — and mail
 * them a second confirmation link for the trouble.
 *
 * @param {{ statuses?: string[] }} [options]
 * @returns {{ email: string, status: string, created_at: string, confirmed_at: string | null, source: string | null, ip: string | null }[]}
 */
export function exportSubscribers({ statuses = ["confirmed"] } = {}) {
  const placeholders = statuses.map(() => "?").join(", ");

  return /** @type {any[]} */ (
    db()
      .prepare(
        `SELECT email, status, created_at, confirmed_at, source, ip
         FROM subscribers
         WHERE status IN (${placeholders})
           AND NOT (status = 'pending' AND mailerlite_at IS NOT NULL)
         ORDER BY id`
      )
      .all(...statuses)
  );
}

/** @returns {{ confirmed: number, pending: number, unsubscribed: number, handedToMailerlite: number }} */
export function listStats() {
  const rows = /** @type {any[]} */ (
    db().prepare("SELECT status, COUNT(*) AS count FROM subscribers GROUP BY status").all()
  );

  const stats = { confirmed: 0, pending: 0, unsubscribed: 0, handedToMailerlite: 0 };
  for (const row of rows) {
    if (row.status in stats) stats[row.status] = Number(row.count);
  }

  const handed = /** @type {any} */ (
    db().prepare("SELECT COUNT(*) AS count FROM subscribers WHERE mailerlite_at IS NOT NULL").get()
  );
  stats.handedToMailerlite = Number(handed?.count ?? 0);

  return stats;
}
