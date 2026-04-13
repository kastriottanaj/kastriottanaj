# Project: kastriottanaj.com

## Stack
- **Backend:** Django 4.2, DRF, PostgreSQL, WhiteNoise, Gunicorn
- **Frontend:** React + Vite (JSX, no TypeScript)
- **Deployment:** Render (render.yaml), Docker
- **SEO:** Custom seo app with sitemaps, robots.txt, llms.txt/llms-full.txt

## Commands
- `python manage.py runserver` — backend dev server
- `cd frontend && npm run dev` — frontend dev server (port 5173)
- `cd frontend && npm run build` — production build
- `python manage.py test` — run Django tests
- `./build.sh` — production build script (Render)

## Architecture
- `config/` — Django settings, URLs, WSGI/ASGI
- `api/` — DRF serializers, views, URLs (serves JSON to frontend)
- `blog/`, `portfolio/`, `contact/` — Django apps with models/views/admin
- `seo/` — Sitemaps, robots.txt, llms.txt views (served via Django, source in frontend/public/)
- `frontend/src/` — React SPA (pages, components, services/api.js)

## Business Context
This is the personal website of Kastriot Tanaj — an **SEO & AI Automation consultant targeting the New York City market**. The site serves two core offerings:
1. **SEO Consulting** — strategy, audits, AI-powered content systems, coaching
2. **AI Automation** — business workflow automation, SEO reporting automation, lead nurturing

Both services must be reflected consistently across all SEO touchpoints:
- Meta titles & descriptions (frontend/src/components/SEO.jsx)
- Structured data / JSON-LD schemas (LocalBusiness, Person, Service schemas in SEO.jsx)
- llms.txt and llms-full.txt (frontend/public/)
- Sitemap (seo/sitemaps.py)
- Page content (Home, Services, About pages)

## Conventions
- Backend uses python-decouple for env vars (never hardcode secrets)
- CORS configured for frontend dev server on localhost:5173
- REST API lives under /api/ prefix
- Frontend fetches from /api/ endpoints
- SEO is the #1 priority — always preserve meta tags, structured data, sitemap coverage, and AI Automation + SEO positioning in all copy
- NYC geo-targeting is active (geo.region US-NY meta tags, NY address in schemas)

## Copywriting & Conversion Principles (Straight Line)
The website follows Jordan Belfort's Straight Line Persuasion principles adapted for a consulting website. All copy, UX, and page structure must reinforce these:

### The Three 10's — every page should move the visitor toward:
1. **Love the service (10/10)** — Position SEO & AI Automation services as the best solution since sliced bread. Lead with results, case studies, and concrete outcomes (rankings, traffic, revenue).
2. **Trust the person (10/10)** — Establish Kastriot as an authority: sharp as a tack, enthusiastic, a force to be reckoned with. Use credentials, client logos, testimonials, and the European-to-NYC story to build credibility.
3. **Trust the company (10/10)** — Since this is a personal brand, reinforce professionalism, integrity, and long-term commitment. Portfolio results, transparent process, and social proof do this.

### First Impression (4 seconds)
Within seconds of landing, the visitor must perceive:
- **Enthusiasm** — the site radiates energy and confidence (not hype)
- **Expertise** — sharp, professional design and copy that signals deep knowledge
- **Authority** — positioned as a force to be reckoned with, not just another freelancer

### Pain & Urgency (unconscious level)
- Increase awareness of what the prospect is missing without SEO & AI automation (competitors outranking them, wasted ad spend, manual processes eating time)
- Use future pacing: paint a picture of what life looks like AFTER working together
- Never manipulate — ethically highlight the cost of inaction

### Lower the Buying Threshold
- **Opt-in bribe:** Free SEO consultation / audit as the primary CTA across all pages
- **Exit popup (LeadCapture/ExitPopup):** Catch visitors before they leave with a compelling free offer
- Make the first step feel low-risk and easy: "Book a free call" not "Buy now"

### Straight Line Sales Funnel (website flow)
1. **Lead Capture** — Free SEO consultation opt-in (Home hero, Contact page, exit popup)
2. **Build Trust** — Portfolio case studies, About page story, blog expertise
3. **Core Offer** — Services page with clear service descriptions and outcomes
4. **Follow-up** — Email nurture sequences, retargeting (future implementation)

### Copy Guidelines
- Every word must be deliberate — move the visitor down the straight line toward the CTA
- Build both logical AND emotional cases (results + vision of success)
- Use the intelligence-gathering mindset: the site should answer the visitor's questions before they ask
- Qualify visitors: speak directly to NYC businesses who need SEO & AI automation, so the right people self-select

## Working Style
- Always share the thinking process. For every decision (architecture, sequencing, technology, design), explain transparently: What are the options? What speaks for/against each? Why is the decision made this way? The user wants to understand the reasoning, not just see the result.
- Work step by step — do not tackle multiple large tasks at once. Complete and validate one task at a time before moving to the next.
