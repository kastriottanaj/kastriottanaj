import type { APIRoute } from "astro";
import { subscribe, normalizeEmail } from "../../lib/newsletter-store.mjs";
import { sendConfirmationEmail } from "../../lib/newsletter-email.mjs";
import { verifyTurnstile } from "../../lib/turnstile";
import { rateLimit } from "../../lib/rate-limit";
import { clientIp, respond, methodNotAllowed, requestTooLarge, EMAIL_RE } from "../../lib/request";

export const prerender = false;

const REDIRECTS = {
  // Same wording as the JSON path: the address is on the list only once the
  // link in the mail is clicked, so "check your inbox" is the honest ending.
  success: "/newsletter/check-inbox/",
  failure: (error: string) => `/newsletter/?error=${encodeURIComponent(error)}#subscribe`,
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (requestTooLarge(request)) {
    return respond(request, 413, { ok: false, error: "too_large" }, REDIRECTS);
  }

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
    form = await request.formData();
  } catch {
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
  try {
    ({ outcome, confirmToken } = subscribe({
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
    const sent = await sendConfirmationEmail({ address: email, token: confirmToken });
    if (!sent) {
      // The row exists but the person will never see a link, so this one is
      // worth telling them about rather than pretending it worked.
      console.error("[subscribe] stored but confirmation mail failed for", email);
      return respond(request, 502, { ok: false, error: "mail" }, REDIRECTS);
    }
  }

  // Every other outcome — already confirmed, or a resend inside the cooldown —
  // gets the same answer. Whether an address is on the list is not something
  // the form should tell a stranger.
  console.info(`[subscribe] ${outcome}`, { source });
  return respond(request, 200, { ok: true }, REDIRECTS);
};

export const ALL: APIRoute = () => methodNotAllowed("POST");
