import type { APIContext } from "astro";
import { SITE } from "../lib/site";

/**
 * Public pages are intentionally crawlable by search engines and AI crawlers.
 * Keep one wildcard group so every compliant crawler inherits the same internal
 * route exclusions; a named group would replace these rules for that bot.
 *
 * Utility HTML pages such as /thanks/ stay crawlable so their `noindex` meta
 * directives can be read. robots.txt controls crawling, not reliable deindexing.
 */
export async function GET(context: APIContext) {
  const site = (context.site ?? new URL(SITE.url)).origin;

  const body = `# ${SITE.name} — ${site}
# Public content is open to search engines and AI crawlers.
# One wildcard group keeps the internal-route exclusions consistent for all bots.

User-agent: *
Disallow: /api/
# Send-ready newsletter JSON; readable issues live at /newsletter/archive/.
Disallow: /newsletter/email/

Sitemap: ${site}/sitemap-index.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
