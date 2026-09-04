import type { APIRoute } from "astro";
import { confirmSubscriber, markHandedOff } from "../../../lib/newsletter-store.mjs";
import { sendWelcomeEmail } from "../../../lib/newsletter-email.mjs";
import {
  mailerliteConfigured,
  mailerliteTimestamp,
  upsertSubscriber,
} from "../../../lib/mailerlite.mjs";
import { clientIp, methodNotAllowed } from "../../../lib/request";

/**
 * The far end of the double opt-in link. Lives under /api/ because that is the
 * only prefix Caddy proxies to Node (deploy/Caddyfile) — everything else on the
 * site is a file on disk.
 */
export const prerender = false;

function seeOther(path: string) {
  return new Response(null, { status: 303, headers: { Location: path } });
}

export const GET: APIRoute = async ({ url, request, clientAddress }) => {
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

  /* Clicking twice is normal; only the first click earns a greeting.

     This route is the *fallback* path once MailerLite owns opt-in — a token
     this site issued because the MailerLite push failed, or a link from a mail
     sent before the switch. Either way the address has now proved itself, so it
     goes over as `active` with the opt-in timestamp and IP that make the
     consent auditable. MailerLite's automation is then the welcome; ours only
     runs when the push did not land. */
  if (result.firstConfirmation) {
    let handedOff = false;

    if (mailerliteConfigured()) {
      const ip = clientIp(request, clientAddress);
      const now = mailerliteTimestamp();
      const pushed = await upsertSubscriber({
        email: result.email,
        status: "active",
        source: result.source,
        ip,
        subscribedAt: now,
        optedInAt: now,
        optinIp: ip,
      });
      handedOff = pushed.ok;
      if (pushed.ok) markHandedOff(result.email);
      else console.error("[confirm] MailerLite push failed, sending our own welcome instead");
    }

    if (!handedOff) {
      await sendWelcomeEmail({
        address: result.email,
        unsubscribeToken: result.unsubscribeToken,
      });
    }
  }

  return seeOther("/newsletter/confirmed/");
};

export const ALL: APIRoute = () => methodNotAllowed("GET");
