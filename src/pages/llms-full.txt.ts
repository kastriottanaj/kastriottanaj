import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { SITE } from "../lib/site";

/**
 * The full text of the site's content pages, as one markdown file — the
 * companion to llms.txt (see llmstxt.org). llms.txt is a map; this is the
 * territory. A model that can read this does not have to fetch and strip
 * twenty pages to find the sentence it wants to cite.
 *
 * Each entry leads with its canonical URL so a citation has somewhere to
 * point. Bodies are the source markdown, verbatim: the whole point of the
 * file is to hand a model the writing exactly as published.
 */
export async function GET(context: APIContext) {
  const site = (context.site ?? new URL(SITE.url)).origin;

  const services = (await getCollection("services")).sort((a, b) => a.data.order - b.data.order);
  const useCases = (await getCollection("useCases", ({ data }) => !data.draft)).sort(
    (a, b) => a.data.order - b.data.order
  );
  const bootcamps = (await getCollection("bootcamps", ({ data }) => !data.draft)).sort(
    (a, b) => a.data.order - b.data.order
  );
  const cases = (await getCollection("work", ({ data }) => !data.draft)).sort(
    (a, b) => a.data.order - b.data.order
  );
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  const iso = (d: Date) => d.toISOString().slice(0, 10);

  /** A titled list, or nothing — an empty heading is worse than no heading. */
  const section = (heading: string, items: string[]) =>
    items.length ? `\n## ${heading}\n\n${items.join("\n")}\n` : "";

  const faq = (items: { q: string; a: string }[]) =>
    section(
      "FAQ",
      items.map((f) => `**${f.q}**\n\n${f.a}\n`)
    );

  const titled = (items: { title: string; detail: string }[]) =>
    items.map((i) => `- **${i.title}** — ${i.detail}`);

  const bullets = (items: string[]) => items.map((i) => `- ${i}`);

  /**
   * One entry. Title is the page's own H1 — this file reproduces pages, so a
   * heading here should match the heading a reader sees there.
   */
  const entry = (opts: {
    title: string;
    url: string;
    meta: string[];
    lede?: string;
    body?: string;
    extra?: string;
  }) => {
    const head = [`# ${opts.title}`, "", `Source: ${site}${opts.url}`, ...opts.meta];
    // HTML comments are notes to whoever edits the file — where the real page
    // lives, what is and is not read from frontmatter. A browser never shows
    // them; this file must not either.
    const body = (opts.body ?? "").replace(/<!--[\s\S]*?-->/g, "").trim();
    const lede = opts.lede?.trim();
    const parts = [head.join("\n")];
    // A post whose description *is* its first paragraph would print it twice.
    if (lede && !body.startsWith(lede)) parts.push(lede);
    if (body) parts.push(body);
    if (opts.extra?.trim()) parts.push(opts.extra.trim());
    return parts.join("\n\n");
  };

  const divider = "\n\n---\n\n";

  const body = `# ${SITE.name} — full text

> ${SITE.description}

${SITE.jobTitle}, based in ${SITE.based}.

This file is the full text of every service, use case, bootcamp, case study and blog post on ${site}, in that order. The site map with one line per page is at ${site}/llms.txt. Each entry below opens with its canonical URL.
${divider}${[
    ...services.map((s) =>
      entry({
        title: s.data.title,
        url: `/services/${s.id}/`,
        meta: ["Type: Service"],
        lede: s.data.description,
        body: s.body,
        extra: section("What's included", bullets(s.data.includes)) + faq(s.data.faq),
      })
    ),
    ...useCases.map((u) =>
      entry({
        title: u.data.title,
        url: `/use-cases/${u.id}/`,
        meta: ["Type: Use case", `Audience: ${u.data.audience}`],
        lede: u.data.description,
        body: u.body,
        extra:
          section("What is broken in this market", titled(u.data.problems)) +
          section("What I do about it", titled(u.data.plays)) +
          section("What the business can do afterwards", bullets(u.data.outcomes)) +
          faq(u.data.faq),
      })
    ),
    ...bootcamps.map((b) =>
      entry({
        title: b.data.title,
        url: `/bootcamps/${b.id}/`,
        meta: ["Type: Bootcamp", `Format: ${b.data.format}`],
        lede: [b.data.headline, b.data.description].join("\n\n"),
        body: b.body,
        extra:
          section("What you can do afterwards", bullets(b.data.outcomes)) +
          section("Who it is for", bullets(b.data.fit)) +
          section("Who it is not for", bullets(b.data.notFit)) +
          section(
            "Modules",
            b.data.modules.map(
              (m) =>
                `- **${m.title}** — ${m.summary}` +
                (m.lessons.length ? `\n${m.lessons.map((l) => `  - ${l}`).join("\n")}` : "")
            )
          ) +
          faq(b.data.faq),
      })
    ),
    ...cases.map((c) =>
      entry({
        title: c.data.title,
        url: `/work/${c.id}/`,
        meta: [
          "Type: Case study",
          `Client: ${c.data.client}`,
          ...(c.data.year ? [`Year: ${c.data.year}`] : []),
          ...(c.data.services.length ? [`Services: ${c.data.services.join(", ")}`] : []),
        ],
        lede: c.data.summary,
        body: c.body,
      })
    ),
    ...posts.map((p) =>
      entry({
        title: p.data.title,
        url: `/blog/${p.id}/`,
        meta: [
          "Type: Blog post",
          `Published: ${iso(p.data.pubDate)}`,
          ...(p.data.updatedDate ? [`Updated: ${iso(p.data.updatedDate)}`] : []),
          ...(p.data.tags.length ? [`Tags: ${p.data.tags.join(", ")}`] : []),
        ],
        lede: p.data.description,
        body: p.body,
      })
    ),
  ].join(divider)}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
