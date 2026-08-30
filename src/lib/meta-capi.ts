/**
 * Meta Conversions API — the server-side twin of the browser pixel.
 *
 * The pixel loses a real share of events to ad blockers and browser tracking
 * protection. This sends the same Lead from the server, where nothing can
 * strip it. Both carry the same event_id, which is how Meta collapses the pair
 * into one conversion rather than counting it twice.
 *
 * Two switches keep it off by default: META_CAPI_ACCESS_TOKEN must be set, and
 * the visitor must have accepted the cookie banner. The server cannot see that
 * choice on its own, so site.js posts it with the form.
 */

import { createHash } from "node:crypto";
import { META_PIXEL_ID } from "./site";

/* Pinned rather than left off: an unversioned Graph call resolves to the
   oldest version Meta still supports, which is always the one nearest removal.
   v26.0 is current as of August 2026. */
const API_VERSION = process.env.META_CAPI_VERSION ?? "v26.0";

/* The lead is already on disk and emailed by the time this runs, so a slow
   Meta must never hold up the response. */
const TIMEOUT_MS = 3000;

export type LeadEvent = {
  /** Shared with the browser pixel's Lead so Meta can deduplicate the pair. */
  eventId: string;
  email: string;
  name: string;
  service: string;
  /** The page the form was submitted from — required for website events. */
  sourceUrl: string | null;
  ip: string | null;
  userAgent: string | null;
  /** Raw Cookie header; _fbp and _fbc are read out of it. */
  cookieHeader: string | null;
};

/** Meta matches on SHA-256 of the lowercased, trimmed value — never the plain one. */
function hashed(value: string | null | undefined): string | null {
  const normalised = value?.trim().toLowerCase();
  return normalised ? createHash("sha256").update(normalised).digest("hex") : null;
}

/** _fbp and _fbc are the pixel's own cookies and the strongest match signal
    there is. They only exist once the visitor has consented, which is exactly
    when we are allowed to send them. */
function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;

  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq > 0 && trimmed.slice(0, eq) === name) return trimmed.slice(eq + 1) || null;
  }

  return null;
}

/** Meta rejects a payload carrying empty identifiers, so drop them entirely. */
function compact<T extends Record<string, unknown>>(source: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== null && value !== undefined && value !== "")
  ) as Partial<T>;
}

/**
 * Post one Lead. Resolves either way: a measurement call is never worth
 * failing a form submission over, so every error is logged and swallowed.
 */
export async function sendLeadEvent(event: LeadEvent): Promise<void> {
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!token) return;

  // Meta wants first and last name hashed separately. A single-word name is
  // a first name; anything after the first space is the surname.
  const [first, ...rest] = event.name.trim().split(/\s+/);

  const payload = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        event_source_url: event.sourceUrl ?? undefined,
        action_source: "website",
        user_data: compact({
          em: hashed(event.email),
          fn: hashed(first),
          ln: hashed(rest.join(" ")),
          client_ip_address: event.ip,
          client_user_agent: event.userAgent,
          fbp: readCookie(event.cookieHeader, "_fbp"),
          fbc: readCookie(event.cookieHeader, "_fbc"),
        }),
        custom_data: { content_name: "Contact form", service: event.service },
      },
    ],
    // Set META_CAPI_TEST_EVENT_CODE to watch events land in the Events Manager
    // test tool. Leave it unset in production — test events are not counted.
    test_event_code: process.env.META_CAPI_TEST_EVENT_CODE || undefined,
    // In the body rather than the query string: this token is a credential and
    // query strings have a habit of turning up in logs.
    access_token: token,
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${META_PIXEL_ID}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );

    if (!response.ok) {
      // Meta's error body carries an fbtrace_id, which is the only thing their
      // support can act on — so log the body, not just the status.
      const body = await response.text().catch(() => "<unreadable>");
      console.error(`[meta-capi] ${response.status} rejected the Lead:`, body.slice(0, 500));
    }
  } catch (error) {
    console.error("[meta-capi] could not send the Lead:", error);
  }
}
