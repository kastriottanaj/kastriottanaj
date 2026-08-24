import type { APIRoute } from "astro";
import { unsubscribe } from "../../../lib/newsletter-store.mjs";
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

  let removed = false;
  try {
    removed = unsubscribe(token);
  } catch (error) {
    console.error("[unsubscribe] update failed:", error);
    return new Response(null, { status: 303, headers: { Location: "/newsletter/?error=server" } });
  }

  return new Response(null, {
    status: 303,
    headers: { Location: removed ? "/newsletter/unsubscribed/" : "/newsletter/?error=link" },
  });
};

export const ALL: APIRoute = () => methodNotAllowed("GET");
