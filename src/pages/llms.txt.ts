import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { SITE } from "../lib/site";

/** A plain-text map of the site for language models — see llmstxt.org. */
export async function GET(context: APIContext) {
  const site = (context.site ?? new URL(SITE.url)).origin;

  const services = (await getCollection("services")).sort((a, b) => a.data.order - b.data.order);
  const bootcamps = (await getCollection("bootcamps", ({ data }) => !data.draft)).sort(
    (a, b) => a.data.order - b.data.order
  );
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );
  const cases = (await getCollection("work", ({ data }) => !data.draft)).sort(
    (a, b) => a.data.order - b.data.order
  );

  const list = (items: { url: string; name: string; note: string }[]) =>
    items.map((i) => `- [${i.name}](${site}${i.url}): ${i.note}`).join("\n");

  const body = `# ${SITE.name}

> ${SITE.description}

${SITE.jobTitle}, based in ${SITE.based}.

## Services

${list(
  services.map((s) => ({
    url: `/services/${s.id}/`,
    name: s.data.title,
    note: s.data.short,
  }))
)}

## Bootcamps

${list(
  bootcamps.map((b) => ({
    url: `/bootcamps/${b.id}/`,
    name: b.data.title,
    note: b.data.short,
  }))
)}

## Case studies

${list(
  cases.map((c) => ({
    url: `/work/${c.id}/`,
    name: c.data.title,
    note: c.data.summary,
  }))
)}

## Writing

${list(
  posts.map((p) => ({
    url: `/blog/${p.id}/`,
    name: p.data.title,
    note: p.data.description,
  }))
)}

## Contact

- [Contact form](${site}/#contact): Enquiries about SEO, digital marketing, AI automation and web development.
- [LinkedIn](${SITE.linkedin})
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
