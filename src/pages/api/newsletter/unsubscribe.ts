import type { APIRoute } from "astro";
import { unsubscribe } from "../../../lib/newsletter-store.mjs";
import { mailerliteConfigured, upsertSubscriber } from "../../../lib/mailerlite.mjs";
import { methodNotAllowed } from "../../../lib/request";

/**
 * One click, no login, no "tell us why" — the link in every issue lands here
 * and the address stops receiving mail immediately.
 *
 * A GET does the work on purpose. RFC 8058 one-click POST would be nicer, but
 * Astro's origin check (security.checkOrigin in astro.config.mjs) rejects a
 * POST that arrives without an Origin header, which is exactly how a mail
 * provider sends one. The page this redirects to therefore covers the other
 * risk of a GET — a link scanner clicking it — by explaining how to get back on.
 */
export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get("token") ?? "";

  let removed: string | null = null;
  try {
    removed = unsubscribe(token);
  } catch (error) {
    console.error("[unsubscribe] update failed:", error);
    return new Response(null, { status: 303, headers: { Location: "/newsletter/?error=server" } });
  }

  /* Carry it to MailerLite too. These links live forever inside mails already
     delivered, and "unsubscribed here but still on the list over there" is the
     one outcome nobody clicking this expects. A failure is logged rather than
     shown: the address is already off this list, and telling them it did not
     work would only invite a second click that changes nothing. */
  if (removed && mailerliteConfigured()) {
    const pushed = await upsertSubscriber({ email: removed, status: "unsubscribed" });
    if (!pushed.ok) console.error("[unsubscribe] MailerLite still has", removed);
  }

  return new Response(null, {
    status: 303,
    headers: { Location: removed ? "/newsletter/unsubscribed/" : "/newsletter/?error=link" },
  });
};

export const ALL: APIRoute = () => methodNotAllowed("GET");
