import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { SITE } from "../lib/site";

/** A plain-text map of the site for language models — see llmstxt.org. */
export async function GET(context: APIContext) {
  const site = (context.site ?? new URL(SITE.url)).origin;

  const services = (await getCollection("services")).sort((a, b) => a.data.order - b.data.order);
  const useCases = (await getCollection("useCases", ({ data }) => !data.draft)).sort(
    (a, b) => a.data.order - b.data.order
  );
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

## Start here

${list([
  { url: "/", name: "Home", note: SITE.tagline },
  {
    url: "/about/",
    name: "About",
    note: "Who I am, what I work on, how I work, and the results behind it.",
  },
])}

## Services

${list([
  {
    url: "/services/",
    name: "All services",
    note: "SEO, digital marketing, AI automation and web development for businesses across Europe.",
  },
  ...services.map((s) => ({
    url: `/services/${s.id}/`,
    name: s.data.title,
    note: s.data.short,
  })),
])}

## Use cases

${list([
  {
    url: "/use-cases/",
    name: "All use cases",
    note: "How the SEO, web and automation work applies to a specific industry — what breaks in that market, and what I'd do about it.",
  },
  ...useCases.map((u) => ({
    url: `/use-cases/${u.id}/`,
    name: u.data.title,
    note: u.data.short,
  })),
])}

## Bootcamps

${list([
  {
    url: "/bootcamps/",
    name: "All bootcamps",
    note: "Self-paced SEO and WordPress bootcamps built from live client work, with lifetime access.",
  },
  ...bootcamps.map((b) => ({
    url: `/bootcamps/${b.id}/`,
    name: b.data.title,
    note: b.data.short,
  })),
])}

## Case studies

${list([
  {
    url: "/work/",
    name: "Selected work",
    note: "Case studies for businesses that want more search visibility, qualified leads, and less manual work.",
  },
  ...cases.map((c) => ({
    url: `/work/${c.id}/`,
    name: c.data.title,
    note: c.data.summary,
  })),
])}

## Writing

${list([
  {
    url: "/blog/",
    name: "Blog",
    note: "Field-tested ideas for business owners and marketers who want more search visibility and less manual work.",
  },
  {
    url: "/newsletter/",
    name: "Newsletter",
    note: "Short, practical emails on SEO, digital marketing and AI automation — no fixed schedule, one-click unsubscribe.",
  },
  ...posts.map((p) => ({
    url: `/blog/${p.id}/`,
    name: p.data.title,
    note: p.data.description,
  })),
])}

## Working together

- [Process](${site}/process/): The five phases every engagement runs through — audit, strategy, build, automate, report.
- [Pricing](${site}/pricing/): The three packages, what each includes, and how a quote is put together.

## Contact

- [Contact](${site}/contact/): Enquiries about SEO, digital marketing, AI automation and web development.
- [LinkedIn](${SITE.linkedin})

## Optional

- [Northbound Albania](${site}/northbound/): A standalone landing page for a separate travel brand hosted on this domain — private, tailor-made journeys through Shkodër and Northern Albania. Not part of the SEO and automation practice above.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
