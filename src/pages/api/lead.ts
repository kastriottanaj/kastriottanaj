import type { APIRoute } from "astro";
import { saveLead, markEmailed } from "../../lib/db";
import { sendLeadEmail } from "../../lib/email";
import { verifyTurnstile } from "../../lib/turnstile";
import { rateLimit } from "../../lib/rate-limit";
import { SERVICE_OPTIONS } from "../../lib/site";

// The one route on the site that is not a static file.
export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Behind Caddy the socket address is always 127.0.0.1, so the real visitor has
 * to come from a proxy header.
 *
 * CF-Connecting-IP first: with Cloudflare proxying, it is a single address that
 * Cloudflare overwrites on every request, whereas X-Forwarded-For is a
 * client-appendable list. Both are only trustworthy because the origin firewall
 * restricts 80/443 to Cloudflare's ranges — see deploy/cloudflare-lockdown.sh.
 */
function clientIp(request: Request, fallback: string | undefined): string | null {
  const cloudflare = request.headers.get("cf-connecting-ip");
  if (cloudflare) return cloudflare.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();

  return fallback ?? null;
}

function wantsJson(request: Request): boolean {
  return (request.headers.get("accept") ?? "").includes("application/json");
}

/** JSON for the enhanced path, a 303 to /thanks/ for a plain form post. */
function respond(request: Request, status: number, payload: { ok: boolean; error?: string }) {
  if (wantsJson(request)) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (payload.ok) {
    return new Response(null, { status: 303, headers: { Location: "/thanks/" } });
  }

  // No-JS failure: back to the form with an error flag the page can read.
  return new Response(null, {
    status: 303,
    headers: { Location: `/?error=${encodeURIComponent(payload.error ?? "failed")}#contact` },
  });
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientIp(request, clientAddress);

  const limit = rateLimit(ip ?? "unknown");
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
    return respond(request, 400, { ok: false, error: "bad_request" });
  }

  const value = (key: string) => String(form.get(key) ?? "").trim();

  // Honeypot. Answer exactly as if it worked — a bot that knows it was caught
  // is a bot that tries again differently.
  if (value("company")) {
    console.info("[lead] honeypot triggered", { ip });
    return respond(request, 200, { ok: true });
  }

  const turnstileOk = await verifyTurnstile(
    (form.get("cf-turnstile-response") as string | null) ?? null,
    ip
  );
  if (!turnstileOk) {
    return respond(request, 400, { ok: false, error: "captcha" });
  }

  const name = value("name");
  const email = value("email");
  const message = value("message");
  const rawService = value("service");
  const service = (SERVICE_OPTIONS as readonly string[]).includes(rawService)
    ? rawService
    : "Not sure yet";

  if (!name || name.length > 100) return respond(request, 400, { ok: false, error: "name" });
  if (!email || email.length > 200 || !EMAIL_RE.test(email)) {
    return respond(request, 400, { ok: false, error: "email" });
  }
  if (!message || message.length > 5000) return respond(request, 400, { ok: false, error: "message" });

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
    return respond(request, 500, { ok: false, error: "server" });
  }

  // Delivery failure is logged and left for the nightly digest to catch — the
  // sender already gave us their details, so it is not their problem to retry.
  const delivered = await sendLeadEmail({ name, email, service, message });
  if (delivered) markEmailed(id);
  else console.error(`[lead] stored as #${id} but not emailed`);

  return respond(request, 200, { ok: true });
};

/** Anything other than POST gets a clear answer rather than a 404. */
export const ALL: APIRoute = () =>
  new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json", Allow: "POST" },
  });
