/**
 * MailerLite, the list of record.
 *
 * Optional by design, exactly like Turnstile and the Meta CAPI: with
 * MAILERLITE_API_KEY unset every call here is a no-op and the site falls back
 * to the self-hosted double opt-in it has always had. Set the key and MailerLite
 * owns the opt-in mail, the automations and the campaigns — the SQLite table
 * stays behind it as a backup nobody else can switch off.
 *
 * Plain JavaScript so scripts/ can import it under bare node, same reason as
 * newsletter-store.mjs.
 *
 * Docs: https://developers.mailerlite.com/docs/subscribers.html
 */

const API_BASE = "https://connect.mailerlite.com/api";

/** A signup is a person waiting on a form. Ten seconds, then fall back to SMTP. */
const TIMEOUT_MS = 10_000;

/** MailerLite allows 120 requests a minute; a form will never come close, so a
 *  single retry only ever covers a dropped connection or a 5xx blip. */
const RETRY_DELAY_MS = 500;

export function mailerliteConfigured() {
  return Boolean(process.env.MAILERLITE_API_KEY);
}

/**
 * Who sends the "please confirm" mail.
 *
 * The default hands opt-in to MailerLite: the address is pushed as
 * `unconfirmed`, MailerLite mails them, and the automation runs off their
 * confirmation. That needs **Account settings → Subscribe settings → Double
 * opt-in for API and integrations** switched ON — without it an API-created
 * `unconfirmed` contact sits there silently and nobody ever gets a link.
 *
 * MAILERLITE_OPT_IN=site keeps this site's own confirmation mail and its
 * /newsletter/confirmed/ page, and pushes to MailerLite only once the address
 * has confirmed here. Slower to set up, but it works before the sending domain
 * is verified in MailerLite.
 */
export function mailerliteOwnsOptIn() {
  return String(process.env.MAILERLITE_OPT_IN ?? "mailerlite").trim().toLowerCase() !== "site";
}

/** Where new subscribers land. Automations trigger on "joins a group", so this
 *  is what makes a welcome sequence fire. Comma-separated for the rare case of
 *  more than one; unset means MailerLite keeps them ungrouped. */
function configuredGroups() {
  return String(process.env.MAILERLITE_GROUP_ID ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/** MailerLite's date format for subscribed_at / opted_in_at: yyyy-MM-dd HH:mm:ss, UTC.
 *  Null for a date that isn't one — the sync script feeds this whatever SQLite
 *  holds, and a bad row should drop a field, not end the run. */
export function mailerliteTimestamp(date = new Date()) {
  if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace("T", " ");
}

async function request(method, path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${process.env.MAILERLITE_API_KEY}`,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  // Errors carry a JSON body naming the offending field; it is the only thing
  // that makes a 422 debuggable, so read it before throwing anything away.
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // 204s and HTML error pages both land here — the status is enough.
  }

  return { status: response.status, payload };
}

const post = (path, body) => request("POST", path, body);

/**
 * What MailerLite currently holds for an address — `found: false` when it holds
 * nothing. A read before a write, for the one case that needs it: someone
 * submitting the form again months later, whose contact over there may already
 * be `active`.
 *
 * @param {string} email
 * @returns {Promise<{ found: boolean, status: string | null, error: string | null }>}
 */
export async function findSubscriber(email) {
  if (!mailerliteConfigured()) return { found: false, status: null, error: "not_configured" };

  let result;
  try {
    result = await request("GET", `/subscribers/${encodeURIComponent(email)}`);
  } catch (error) {
    console.error("[mailerlite] lookup failed:", error);
    return { found: false, status: null, error: "network" };
  }

  if (result.status === 404) return { found: false, status: null, error: null };
  if (result.status !== 200) {
    console.error(`[mailerlite] lookup returned ${result.status}`);
    return { found: false, status: null, error: `http_${result.status}` };
  }

  return { found: true, status: result.payload?.data?.status ?? null, error: null };
}

/**
 * Every group on the account, newest first. Used by scripts/mailerlite-check.mjs
 * to prove the key works and to show the ids, which are otherwise only visible
 * in the URL of a group page.
 *
 * @returns {Promise<{ ok: boolean, groups: { id: string, name: string, active: number, unconfirmed: number }[], error: string | null }>}
 */
export async function listGroups() {
  if (!mailerliteConfigured()) return { ok: false, groups: [], error: "not_configured" };

  let result;
  try {
    result = await request("GET", "/groups?limit=100&sort=-created_at");
  } catch (error) {
    console.error("[mailerlite] group listing failed:", error);
    return { ok: false, groups: [], error: "network" };
  }

  if (result.status !== 200) {
    return { ok: false, groups: [], error: `http_${result.status}` };
  }

  const groups = (result.payload?.data ?? []).map((group) => ({
    id: String(group.id),
    name: String(group.name),
    active: Number(group.active_count ?? 0),
    unconfirmed: Number(group.unconfirmed_count ?? 0),
  }));

  return { ok: true, groups, error: null };
}

/**
 * Create or update one subscriber. Idempotent on the address: 201 for a new
 * one, 200 for an address MailerLite already knows.
 *
 * `resubscribe` is deliberately never sent. Someone who unsubscribed in
 * MailerLite stays unsubscribed, whatever this site's own table believes.
 *
 * @param {{
 *   email: string,
 *   status?: "active" | "unconfirmed" | "unsubscribed",
 *   source?: string | null,
 *   ip?: string | null,
 *   subscribedAt?: string | null,
 *   optedInAt?: string | null,
 *   optinIp?: string | null,
 *   fields?: Record<string, string> | null,
 * }} input
 * @returns {Promise<{ ok: boolean, status: number, id: string | null, error: string | null }>}
 */
export async function upsertSubscriber({
  email,
  status,
  source = null,
  ip = null,
  subscribedAt = null,
  optedInAt = null,
  optinIp = null,
  fields = null,
}) {
  if (!mailerliteConfigured()) {
    return { ok: false, status: 0, id: null, error: "not_configured" };
  }

  /** @type {Record<string, unknown>} */
  const body = { email };
  if (status) body.status = status;
  if (ip) body.ip_address = ip;
  if (subscribedAt) body.subscribed_at = subscribedAt;
  if (optedInAt) body.opted_in_at = optedInAt;
  if (optinIp) body.optin_ip = optinIp;

  const groups = configuredGroups();
  if (groups.length) body.groups = groups;

  // Goes into the `signup_source` custom field, not `source`: MailerLite
  // reserves that name for its own "how was this contact added" attribute,
  // which reads `api` for everything this file pushes and so cannot answer
  // which page earned the subscriber. The field has to exist over there — but a
  // missing one must not cost a subscriber, so a 422 is retried without any
  // fields at all (see below).
  const custom = { ...(source ? { signup_source: source } : {}), ...(fields ?? {}) };
  const hasFields = Object.keys(custom).length > 0;
  if (hasFields) body.fields = custom;

  let result;
  try {
    result = await post("/subscribers", body);
  } catch {
    // Timeout or dropped connection. One retry, then let the caller fall back.
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    try {
      result = await post("/subscribers", body);
    } catch (retryError) {
      console.error("[mailerlite] request failed:", retryError);
      return { ok: false, status: 0, id: null, error: "network" };
    }
  }

  if (result.status === 422 && hasFields) {
    console.warn(
      "[mailerlite] 422 with custom fields, retrying without them:",
      JSON.stringify(result.payload)
    );
    const { fields: _dropped, ...withoutFields } = body;
    try {
      result = await post("/subscribers", withoutFields);
    } catch (error) {
      console.error("[mailerlite] retry without fields failed:", error);
      return { ok: false, status: 0, id: null, error: "network" };
    }
  }

  if (result.status === 200 || result.status === 201) {
    const id = result.payload?.data?.id ?? null;
    return { ok: true, status: result.status, id: id === null ? null : String(id), error: null };
  }

  console.error(
    `[mailerlite] upsert returned ${result.status}:`,
    JSON.stringify(result.payload)
  );
  return { ok: false, status: result.status, id: null, error: `http_${result.status}` };
}
