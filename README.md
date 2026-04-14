# kastriottanaj.com

Personal website of Kastriot Tanaj — SEO & AI Automation consultant targeting the NYC market.

## Stack

- **Backend:** Django 4.2, DRF, PostgreSQL, WhiteNoise, Gunicorn
- **Frontend:** React + Vite (JSX)
- **Media storage:** Cloudinary (production), local filesystem (dev)
- **Deployment:** Render (backend web service + static frontend)
- **SEO:** Custom `seo` app — sitemaps, robots.txt, llms.txt, llms-full.txt

## Local development

```bash
# Backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver           # http://localhost:8000

# Frontend
cd frontend && npm install
npm run dev                          # http://localhost:5173
```

Environment variables live in `.env` (see `python-decouple` usage in `config/settings.py`).

## Production deployment

Pushing to `main` triggers Render to redeploy both services automatically:
- `kastriottanaj-api` — Django backend (`./build.sh` runs migrations + collectstatic)
- `kastriottanaj-frontend` — static React bundle (`npm run build`)

Required Render env vars: `DATABASE_URL`, `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `SITE_DOMAIN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`.

---

## Publishing blog posts

**All blog posts are created through the Django admin** — never committed to the repo.

1. Sign in at [kastriottanaj-api.onrender.com/admin/](https://kastriottanaj-api.onrender.com/admin/)
2. **Blog → Posts → Add Post**
3. Fill in:
   - **Title** — H1 of the article
   - **Slug** — URL segment (auto-generated from title if left empty)
   - **Excerpt** — short summary (≤300 chars, used as meta description fallback)
   - **Content** — full HTML body (use `<h2>`, `<h3>`, `<p>`, `<ul>`, `<strong>`, `<a>`, etc.)
   - **Featured image** — upload a PNG/JPG; it goes to Cloudinary
   - **Category** — pick or create one (SEO, AI Automation, etc.)
   - **Tags** — many-to-many (create tags first in Blog → Tags)
   - **SEO block** (optional): `meta_title` (≤60), `meta_description` (≤160), `canonical_url`, `focus_keyword`
4. Check **Published** and **Save**

The post is live immediately at `kastriottanaj.com/blog/<slug>`.

### Rules that apply automatically to every new post

Once you check **Published** and save, the following happen without any manual step:

1. **Sitemap inclusion** — the post URL appears in [`kastriottanaj.com/sitemap.xml`](https://kastriottanaj.com/sitemap.xml) on the next crawl. Powered by `BlogSitemap` in `seo/sitemaps.py`, which filters `Post.objects.filter(published=True)`. `lastmod` reflects `updated_at` (so edits re-signal freshness). Unpublishing removes the URL on the next crawl.
2. **JSON-LD Article schema** — the React `BlogPost` page auto-renders `<ArticleSchema>` with headline, description, image, `datePublished`, `dateModified`, and author (see `frontend/src/components/SEO.jsx` → `ArticleSchema`). No manual markup needed.
3. **Open Graph + Twitter cards** — `<SEO type="article">` emits `og:title`, `og:description`, `og:image`, `article:published_time`, `article:modified_time`.
4. **Canonical URL** — set to `/blog/<slug>` automatically; override via the `canonical_url` field only if republishing from elsewhere.
5. **Cloudinary media storage** — the featured image is persisted on Cloudinary's CDN (Render's free-tier filesystem is ephemeral and would otherwise wipe uploads on every redeploy).
6. **Frontend listing + category filter** — the post appears on `/blog` and is filterable by its category and tags.

### Writing guidelines (Straight Line Persuasion — see `CLAUDE.md`)

- Lead with a direct answer in the first paragraph — AI engines (Overviews, ChatGPT Search, Perplexity) cite clear answers and skip fluff.
- Use `<h2>` for major sections, `<h3>` for sub-sections. Don't stack `<h1>` — the post title is already H1.
- End every post with a CTA pointing to `/contact` (free consultation) — it closes the funnel.
- Keep paragraphs short (2–4 sentences) for web reading rhythm.
- NYC geo-targeting is active site-wide; mention NYC/Manhattan/New York where naturally relevant.

---

## Architecture overview

```
config/             Django settings, URLs, WSGI/ASGI
api/                DRF serializers, views, URLs (serves JSON to frontend)
blog/               Post, Category, Tag models + admin
portfolio/          Project, Service models + admin
contact/            Contact form handler + email
seo/                BlogSitemap, ProjectSitemap, ServiceSitemap, robots.txt, llms.txt
frontend/src/
  components/SEO.jsx      Helmet + JSON-LD (Article, Person, LocalBusiness, Service)
  pages/                  Home, About, Services, Blog, BlogPost, BlogTag, Portfolio, Contact
  services/api.js         Axios client for /api/* endpoints
```

## Conventions

- Env vars via `python-decouple` — never hardcode secrets
- CORS allows frontend dev server on `localhost:5173`
- API lives under `/api/`
- Frontend fetches from `/api/` (proxied in dev, absolute URL via `VITE_API_URL` in prod)
- SEO is the #1 priority — meta tags, structured data, sitemap coverage, AI Automation + SEO positioning
