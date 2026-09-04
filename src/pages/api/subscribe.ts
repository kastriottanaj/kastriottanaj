import type { APIRoute } from "astro";
import { subscribe, normalizeEmail, markHandedOff } from "../../lib/newsletter-store.mjs";
import { sendConfirmationEmail } from "../../lib/newsletter-email.mjs";
import {
  findSubscriber,
  mailerliteConfigured,
  mailerliteOwnsOptIn,
  mailerliteTimestamp,
  upsertSubscriber,
} from "../../lib/mailerlite.mjs";
import { verifyTurnstile } from "../../lib/turnstile";
import { rateLimit } from "../../lib/rate-limit";
import {
  clientIp,
  respond,
  methodNotAllowed,
  limitedFormData,
  PayloadTooLargeError,
  EMAIL_RE,
} from "../../lib/request";

export const prerender = false;

const REDIRECTS = {
  // Same wording as the JSON path: the address is on the list only once the
  // link in the mail is clicked, so "check your inbox" is the honest ending.
  success: "/newsletter/check-inbox/",
  failure: (error: string) => `/newsletter/?error=${encodeURIComponent(error)}#subscribe`,
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientIp(request, clientAddress);

  const limit = rateLimit(`subscribe:${ip ?? "unknown"}`);
  if (!limit.allowed) {
    return new Response(JSON.stringify({ ok: false, error: "rate_limited" }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(limit.retryAfter) },
    });
  }

  let form: FormData;
  try {
    form = await limitedFormData(request);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return respond(request, 413, { ok: false, error: "too_large" }, REDIRECTS);
    }
    return respond(request, 400, { ok: false, error: "bad_request" }, REDIRECTS);
  }

  const value = (key: string) => String(form.get(key) ?? "").trim();

  if (value("company")) {
    console.info("[subscribe] honeypot triggered", { ip });
    return respond(request, 200, { ok: true }, REDIRECTS);
  }

  const turnstileOk = await verifyTurnstile(
    (form.get("cf-turnstile-response") as string | null) ?? null,
    ip
  );
  if (!turnstileOk) {
    return respond(request, 400, { ok: false, error: "captcha" }, REDIRECTS);
  }

  const email = normalizeEmail(value("email"));
  if (!email || email.length > 200 || !EMAIL_RE.test(email)) {
    return respond(request, 400, { ok: false, error: "email" }, REDIRECTS);
  }

  // Where they signed up from — useful later for knowing which page earns
  // subscribers. Constrained to a short string; it is visitor-supplied.
  const source = value("source").slice(0, 60) || "site";

  let outcome: string;
  let confirmToken: string | null;
  let handedOffBefore: boolean;
  try {
    ({ outcome, confirmToken, handedOff: handedOffBefore } = subscribe({
      email,
      source,
      ip,
      userAgent: request.headers.get("user-agent"),
    }));
  } catch (error) {
    console.error("[subscribe] could not store:", error);
    return respond(request, 500, { ok: false, error: "server" }, REDIRECTS);
  }

  if (confirmToken) {
    /* Who sends the "please confirm" mail depends on how the list is set up.
       With MailerLite configured and owning opt-in, the address is pushed there
       as `unconfirmed` and MailerLite mails them — which is also what starts
       the automation. Our own mail then exists only as a fallback, for the
       minutes MailerLite is unreachable or the API key has expired.

       Nothing is pushed for an address that is already confirmed, or inside the
       resend cooldown: re-pushing as `unconfirmed` would knock a confirmed
       MailerLite contact back to unconfirmed and mail them again. */
    let handedOff = false;

    if (mailerliteConfigured() && mailerliteOwnsOptIn()) {
      /* An address MailerLite already has is the one case worth a read before a
         write. Their confirmation happened over there, so this row still reads
         `pending` however long ago they joined — and pushing them again as
         `unconfirmed` would demote a live contact and mail them a second link
         for the crime of filling the form twice. */
      const existing = handedOffBefore ? await findSubscriber(email) : null;

      // Leave MailerLite alone when it already holds them as a live contact —
      // and equally when the lookup itself failed. A repeat submission is worth
      // nothing next to demoting a confirmed contact on a guess.
      if (existing && (existing.status === "active" || existing.error !== null)) {
        console.info("[subscribe] left to MailerLite", { source, status: existing.status });
        handedOff = true;
      } else {
        const pushed = await upsertSubscriber({
          email,
          status: "unconfirmed",
          source,
          ip,
          subscribedAt: mailerliteTimestamp(),
        });
        handedOff = pushed.ok;
        if (pushed.ok) markHandedOff(email);
        else console.error("[subscribe] MailerLite push failed, sending our own confirmation instead");
      }
    }

    if (!handedOff) {
      const sent = await sendConfirmationEmail({ address: email, token: confirmToken });
      if (!sent) {
        // The row exists but the person will never see a link, so this one is
        // worth telling them about rather than pretending it worked.
        console.error("[subscribe] stored but confirmation mail failed for", email);
        return respond(request, 502, { ok: false, error: "mail" }, REDIRECTS);
      }
    }
  }

  // Every other outcome — already confirmed, or a resend inside the cooldown —
  // gets the same answer. Whether an address is on the list is not something
  // the form should tell a stranger.
  console.info(`[subscribe] ${outcome}`, { source });
  return respond(request, 200, { ok: true }, REDIRECTS);
};

export const ALL: APIRoute = () => methodNotAllowed("POST");
