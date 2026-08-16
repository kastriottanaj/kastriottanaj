import type { APIContext } from "astro";
import { SITE } from "../lib/site";

/**
 * AI crawlers are allowed on purpose. Being cited as a source in an AI answer is
 * an acquisition channel, and this site sells the expertise it is publishing.
 * To opt out of a specific one, uncomment its block below.
 */
export async function GET(context: APIContext) {
  const site = (context.site ?? new URL(SITE.url)).origin;

  const body = `# ${SITE.name} — ${site}

User-agent: *
Allow: /
Disallow: /api/
Disallow: /thanks/

# AI crawlers — allowed. Uncomment a block to opt out of that one.
# User-agent: GPTBot
# Disallow: /

# User-agent: ClaudeBot
# Disallow: /

# User-agent: PerplexityBot
# Disallow: /

# User-agent: Google-Extended
# Disallow: /

Sitemap: ${site}/sitemap-index.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
