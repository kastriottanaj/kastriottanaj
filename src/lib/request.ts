/** Small helpers shared by the API routes. */

export const MAX_FORM_BYTES = 64 * 1024;

export class PayloadTooLargeError extends Error {}

/** Reject obviously oversized bodies before asking the multipart parser to
 * buffer them. Caddy enforces the same ceiling for streamed/chunked bodies. */
export function requestTooLarge(request: Request): boolean {
  const raw = request.headers.get("content-length");
  if (!raw) return false;
  const length = Number(raw);
  return !Number.isSafeInteger(length) || length < 0 || length > MAX_FORM_BYTES;
}

/** Read a form through a hard byte ceiling. Content-Length is only a fast
 * rejection: the stream limit is what also covers chunked requests and false
 * or missing length headers. */
export async function limitedFormData(request: Request): Promise<FormData> {
  if (requestTooLarge(request)) throw new PayloadTooLargeError("form body is too large");
  if (!request.body) return request.formData();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_FORM_BYTES) {
        await reader.cancel();
        throw new PayloadTooLargeError("form body is too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new Response(body, { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData();
}

/**
 * Behind Caddy the socket address is always 127.0.0.1, so the real visitor has
 * to come from a proxy header. Exactly one header is trusted, and only because
 * of what Caddy does to it.
 *
 * X-Forwarded-For is safe here because Caddy **ignores the client's value** for
 * every X-Forwarded-* header unless `trusted_proxies` is configured, and it is
 * not (deploy/Caddyfile). What reaches Node is Caddy's own, written from the
 * TCP peer — one entry, not a list an attacker can prepend to.
 *
 * CF-Connecting-IP is deliberately NOT read. It carries no such guarantee: it
 * is not an X-Forwarded-* header, so Caddy passes it through untouched, and
 * kastriottanaj.com resolves straight to this box — the nameservers are
 * Hostinger's, there is no Cloudflare in front. Trusting it let anyone choose
 * their own identity for the per-IP rate limit, and choose the IP stored with
 * every lead, every subscriber, and every opt-in record sent to MailerLite.
 *
 * Putting Cloudflare back in front means reversing this: read CF-Connecting-IP
 * again, restore `header_up -CF-Connecting-IP` in the Caddyfile, and run
 * deploy/cloudflare-lockdown.sh so the origin only answers Cloudflare — the
 * header is worth nothing without that last part.
 */
export function clientIp(request: Request, fallback?: string): string | null {
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
