import type { APIRoute } from "astro";
import { saveLead, markEmailed } from "../../lib/db";
import { sendLeadEmail } from "../../lib/email";
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
import { SERVICE_OPTIONS } from "../../lib/site";

// Not a static file — this one runs on the Node server behind Caddy.
export const prerender = false;

/** Both the homepage and /contact/ carry this form, and both mark it with
    id="contact" — so a no-JS failure only has to pick the right path to land
    back on the form the visitor actually used. Anything else (a stale or
    forged Referer) falls back to the homepage rather than being trusted as a
    redirect target. */
function redirectsFor(request: Request) {
  const referer = request.headers.get("referer");
  let path = "/";

  if (referer) {
    try {
      if (new URL(referer).pathname === "/contact/") path = "/contact/";
    } catch {
      // Malformed Referer — the homepage default already covers it.
    }
  }

  return {
    success: "/thanks/",
    // No-JS failure: back to the form with an error flag the page can read.
    failure: (error: string) => `${path}?error=${encodeURIComponent(error)}#contact`,
  };
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientIp(request, clientAddress);
  const redirects = redirectsFor(request);

  const limit = rateLimit(`lead:${ip ?? "unknown"}`);
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
      return respond(request, 413, { ok: false, error: "too_large" }, redirects);
    }
    return respond(request, 400, { ok: false, error: "bad_request" }, redirects);
  }

  const value = (key: string) => String(form.get(key) ?? "").trim();

  // Honeypot. Answer exactly as if it worked — a bot that knows it was caught
  // is a bot that tries again differently.
  if (value("company")) {
    console.info("[lead] honeypot triggered", { ip });
    return respond(request, 200, { ok: true }, redirects);
  }

  const turnstileOk = await verifyTurnstile(
    (form.get("cf-turnstile-response") as string | null) ?? null,
    ip
  );
  if (!turnstileOk) {
    return respond(request, 400, { ok: false, error: "captcha" }, redirects);
  }

  const name = value("name");
  const email = value("email");
  const message = value("message");
  const rawService = value("service");
  const service = (SERVICE_OPTIONS as readonly string[]).includes(rawService)
    ? rawService
    : "Not sure yet";

  if (!name || name.length > 100) return respond(request, 400, { ok: false, error: "name" }, redirects);
  if (!email || email.length > 200 || !EMAIL_RE.test(email)) {
    return respond(request, 400, { ok: false, error: "email" }, redirects);
  }
  if (!message || message.length > 5000) {
    return respond(request, 400, { ok: false, error: "message" }, redirects);
  }

  // Store first. If the mail provider is down the lead still exists on disk.
  let id: number;
  try {
    id = saveLead({
      name,
      email,
      service,
      message,
      ip,
      userAgent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
    });
  } catch (error) {
    console.error("[lead] could not store:", error);
    return respond(request, 500, { ok: false, error: "server" }, redirects);
  }

  // Delivery failure is logged and left for the nightly digest to catch — the
  // sender already gave us their details, so it is not their problem to retry.
  const delivered = await sendLeadEmail({ name, email, service, message });
  if (delivered) markEmailed(id);
  else console.error(`[lead] stored as #${id} but not emailed`);

  return respond(request, 200, { ok: true }, redirects);
};

export const ALL: APIRoute = () => methodNotAllowed("POST");
