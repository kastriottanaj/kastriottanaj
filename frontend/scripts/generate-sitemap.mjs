#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, '../public/sitemap.xml');

const SITE_URL = 'https://kastriottanaj.com';
const API_URL = process.env.VITE_API_URL || 'https://kastriottanaj-api.onrender.com/api';

const STATIC_ROUTES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/about', changefreq: 'weekly', priority: '1.0' },
  { loc: '/services', lastmod: '2026-04-15', changefreq: 'weekly', priority: '1.0' },
  { loc: '/blog', changefreq: 'weekly', priority: '1.0' },
  { loc: '/portfolio', changefreq: 'weekly', priority: '1.0' },
  { loc: '/contact', changefreq: 'weekly', priority: '1.0' },
];

async function fetchJson(path) {
  const url = `${API_URL}${path}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn(`[sitemap] Failed to fetch ${url}: ${err.message}`);
    return null;
  }
}

function normalizeList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  const parts = [`  <url>`, `    <loc>${SITE_URL}${loc}</loc>`];
  if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`    <priority>${priority}</priority>`);
  parts.push(`  </url>`);
  return parts.join('\n');
}

async function generate() {
  console.log('[sitemap] Generating sitemap.xml...');
  console.log(`[sitemap] API: ${API_URL}`);

  const [posts, tags, projects, services] = await Promise.all([
    fetchJson('/posts/').then(normalizeList),
    fetchJson('/tags/').then(normalizeList),
    fetchJson('/projects/').then(normalizeList),
    fetchJson('/services/').then(normalizeList),
  ]);

  const entries = [];

  for (const route of STATIC_ROUTES) {
    entries.push(urlEntry(route));
  }

  for (const post of posts) {
    entries.push(urlEntry({
      loc: `/blog/${post.slug}`,
      lastmod: formatDate(post.updated_at),
      changefreq: 'weekly',
      priority: '0.8',
    }));
  }

  for (const tag of tags) {
    entries.push(urlEntry({
      loc: `/blog/tag/${tag.slug}`,
      changefreq: 'weekly',
      priority: '0.6',
    }));
  }

  for (const project of projects) {
    entries.push(urlEntry({
      loc: `/portfolio/${project.slug}`,
      lastmod: formatDate(project.updated_at),
      changefreq: 'monthly',
      priority: '0.7',
    }));
  }

  for (const service of services) {
    entries.push(urlEntry({
      loc: `/services/${service.slug}`,
      changefreq: 'monthly',
      priority: '0.9',
    }));
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries.join('\n'),
    '</urlset>',
    '',
  ].join('\n');

  await writeFile(OUTPUT_PATH, xml, 'utf8');

  console.log(`[sitemap] Wrote ${entries.length} URLs to ${OUTPUT_PATH}`);
  console.log(`[sitemap]   ${STATIC_ROUTES.length} static, ${posts.length} posts, ${tags.length} tags, ${projects.length} projects, ${services.length} services`);
}

generate().catch((err) => {
  console.error('[sitemap] Generation failed:', err);
  process.exit(1);
});
