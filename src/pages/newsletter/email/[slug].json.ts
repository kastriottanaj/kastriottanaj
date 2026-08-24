import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, render, type CollectionEntry } from "astro:content";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { SITE } from "../../../lib/site";

/**
 * The send-ready form of each issue, written to disk at build time as
 * dist/client/newsletter/email/<slug>.json and read by scripts/send-newsletter.mjs.
 *
 * Doing it here rather than in the script means the email body comes out of the
 * same markdown pipeline as the web version — one source, no second renderer to
 * keep in step, and no markdown parser added to package.json.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const issues = await getCollection("newsletter", ({ data }) => !data.draft);
  return issues.map((issue) => ({
    params: { slug: issue.id },
    props: { issue },
  }));
};

/** Mail clients have no base URL, so every link and image has to be absolute. */
function absolutize(html: string): string {
  return html.replace(/(href|src)="\/(?!\/)/g, `$1="${SITE.url}/`);
}

/**
 * The plain-text part, from the markdown source rather than the rendered HTML.
 * It is already close to what a text reader wants; only the syntax that reads
 * as noise out loud is stripped.
 */
function markdownToText(markdown: string): string {
  return markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const GET: APIRoute = async ({ props }) => {
  const issue = props.issue as CollectionEntry<"newsletter">;
  const { Content } = await render(issue);

  const container = await AstroContainer.create();
  const html = absolutize(await container.renderToString(Content));

  const body = {
    slug: issue.id,
    subject: issue.data.subject,
    preheader: issue.data.preheader,
    title: issue.data.title,
    publishedAt: issue.data.pubDate.toISOString(),
    url: `${SITE.url}/newsletter/archive/${issue.id}/`,
    html,
    text: markdownToText(issue.body ?? ""),
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
