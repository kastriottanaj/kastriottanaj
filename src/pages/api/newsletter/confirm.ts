import type { APIRoute } from "astro";
import { confirmSubscriber } from "../../../lib/newsletter-store.mjs";
import { sendWelcomeEmail } from "../../../lib/newsletter-email.mjs";
import { methodNotAllowed } from "../../../lib/request";

/**
 * The far end of the double opt-in link. Lives under /api/ because that is the
 * only prefix Caddy proxies to Node (deploy/Caddyfile) — everything else on the
 * site is a file on disk.
 */
export const prerender = false;

function seeOther(path: string) {
  return new Response(null, { status: 303, headers: { Location: path } });
}

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get("token") ?? "";

  let result: ReturnType<typeof confirmSubscriber>;
  try {
    result = confirmSubscriber(token);
  } catch (error) {
    console.error("[confirm] lookup failed:", error);
    return seeOther("/newsletter/?error=server#subscribe");
  }

  // An expired or mistyped link. Sending them back to the form is more use
  // than an error page — subscribing again issues a fresh token.
  if (!result) return seeOther("/newsletter/?error=link#subscribe");

  // Clicking twice is normal; only the first click earns a welcome mail.
  if (result.firstConfirmation) {
    await sendWelcomeEmail({
      address: result.email,
      unsubscribeToken: result.unsubscribeToken,
    });
  }

  return seeOther("/newsletter/confirmed/");
};

export const ALL: APIRoute = () => methodNotAllowed("GET");
