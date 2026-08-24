/** Small helpers shared by the API routes. */

/**
 * Behind Caddy the socket address is always 127.0.0.1, so the real visitor has
 * to come from a proxy header.
 *
 * CF-Connecting-IP first: with Cloudflare proxying, it is a single address that
 * Cloudflare overwrites on every request, whereas X-Forwarded-For is a
 * client-appendable list. Both are only trustworthy because the origin firewall
 * restricts 80/443 to Cloudflare's ranges — see deploy/cloudflare-lockdown.sh.
 */
export function clientIp(request: Request, fallback?: string): string | null {
  const cloudflare = request.headers.get("cf-connecting-ip");
  if (cloudflare) return cloudflare.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();

  return fallback ?? null;
}

/** True when the caller is the enhancement script rather than a plain form post. */
function wantsJson(request: Request): boolean {
  return (request.headers.get("accept") ?? "").includes("application/json");
}

/** JSON for the enhanced path, a redirect for a no-JS form post. */
export function respond(
  request: Request,
  status: number,
  payload: { ok: boolean; error?: string },
  redirects: { success: string; failure: (error: string) => string }
): Response {
  if (wantsJson(request)) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const location = payload.ok ? redirects.success : redirects.failure(payload.error ?? "failed");
  return new Response(null, { status: 303, headers: { Location: location } });
}

/** Anything other than the handled verbs gets a clear answer rather than a 404. */
export function methodNotAllowed(allow: string): Response {
  return new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json", Allow: allow },
  });
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
