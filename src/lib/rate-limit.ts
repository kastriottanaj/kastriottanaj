/**
 * Fixed-window rate limit, per IP, in process memory.
 *
 * Single Node process behind Caddy, so a shared store would be overkill. A
 * restart clears the counters, which is an acceptable trade for a contact form.
 */

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PER_WINDOW = 5;

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now >= entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });

    // Opportunistic sweep — keeps the map from growing without bound.
    if (hits.size > 1000) {
      for (const [k, v] of hits) if (now >= v.resetAt) hits.delete(k);
    }

    return { allowed: true, retryAfter: 0 };
  }

  entry.count += 1;

  if (entry.count > MAX_PER_WINDOW) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  return { allowed: true, retryAfter: 0 };
}
