import { SITE } from "./site";

export interface SitemapUrl {
  path: string;
  lastmod?: Date;
  video?: {
    thumbnail: string;
    title: string;
    description: string;
    content: string;
    duration: number;
    publicationDate: string;
  };
}

export interface SitemapFile {
  path: string;
  lastmod?: Date;
}

const xml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const absolute = (path: string) => new URL(path, SITE.url).href;
const date = (value: Date) => value.toISOString();

export function newest(dates: Date[]): Date | undefined {
  return dates.length ? new Date(Math.max(...dates.map((value) => value.valueOf()))) : undefined;
}

export function sitemapResponse(entries: SitemapUrl[]): Response {
  const hasVideo = entries.some((entry) => entry.video);
  const urls = entries
    .map((entry) => {
      const video = entry.video
        ? `<video:video><video:thumbnail_loc>${xml(entry.video.thumbnail)}</video:thumbnail_loc><video:title>${xml(entry.video.title)}</video:title><video:description>${xml(entry.video.description)}</video:description><video:content_loc>${xml(entry.video.content)}</video:content_loc><video:duration>${entry.video.duration}</video:duration><video:publication_date>${xml(entry.video.publicationDate)}</video:publication_date><video:family_friendly>yes</video:family_friendly><video:live>no</video:live></video:video>`
        : "";
      return `<url><loc>${xml(absolute(entry.path))}</loc>${entry.lastmod ? `<lastmod>${date(entry.lastmod)}</lastmod>` : ""}${video}</url>`;
    })
    .join("");

  return response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${hasVideo ? ' xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"' : ""}>${urls}</urlset>`,
  );
}

export function sitemapIndexResponse(entries: SitemapFile[]): Response {
  const sitemaps = entries
    .map(
      (entry) =>
        `<sitemap><loc>${xml(absolute(entry.path))}</loc>${entry.lastmod ? `<lastmod>${date(entry.lastmod)}</lastmod>` : ""}</sitemap>`,
    )
    .join("");
  return response(
    `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemaps}</sitemapindex>`,
  );
}

function response(body: string): Response {
  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
