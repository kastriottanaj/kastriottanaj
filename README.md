# kastriottanaj.com

Astro site for Kastriot Tanaj — SEO, digital marketing and AI automation.

Static HTML at build time, one server route for lead capture, deployed to a Hetzner
Cloud box behind Caddy.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/client (static) + dist/server (lead API)
npm run check    # astro check — types and diagnostics
```

## The stack

| Layer | Choice |
| --- | --- |
| Framework | Astro 7, `output: "static"` |
| Server | `@astrojs/node` (standalone) — serves `/api/*` only |
| Web server | Caddy — static files, automatic TLS, reverse proxy for the API |
| Host | Hetzner Cloud CAX11 (ARM64), Ubuntu 24.04 |
| Fonts | Astro Fonts API — Archivo, self-hosted, preloaded |
| Email | Hostinger SMTP (STARTTLS on port 587) |
| Lead storage | SQLite via `node:sqlite` |
| Spam | Honeypot + per-IP rate limit + optional Cloudflare Turnstile |
| SEO | `@astrojs/sitemap`, `@astrojs/rss`, JSON-LD, `robots.txt`, `llms.txt` |

No React, no Tailwind, no CSS framework. The only JavaScript shipped to the browser is
`src/scripts/site.js` — mobile nav, scroll-spy, and form enhancement — and the page works
without it.

## Layout

```
src/
  content/            Markdown — the parts you edit most
    blog/             Posts
    services/         The four service pages
    work/             Case studies
  content.config.ts   Collection schemas
  pages/
    api/lead.ts       The one server route (prerender = false)
    services/, work/, blog/
    robots.txt.ts, llms.txt.ts, rss.xml.ts
  lib/
    site.ts           Site-wide copy, nav, service allowlist
    db.ts             SQLite writes
    email.ts          Resend delivery
    turnstile.ts      Optional captcha verification
    rate-limit.ts     Per-IP fixed window
  layouts/Base.astro  Head, meta, JSON-LD, nav, footer
  styles/
    modernist.css     Design system, vendored — see note below
    site.css          Page composition
deploy/
  Caddyfile           Static + reverse proxy + headers
  kastriottanaj.service
  setup-server.sh     One-time provisioning
  deploy.sh           Pull, build, restart, health-check, roll back on failure
  backup-leads.sh     Nightly SQLite backup
```

## How a lead flows

```
Browser  ──POST /api/lead──▶  Caddy  ──▶  Node :4321
                                             │
                     honeypot → rate limit → Turnstile → validate
                                             │
                                     SQLite (always)
                                             │
                               Hostinger SMTP → inbox
                                             │
                              303 → /thanks/   (JS and no-JS alike)
```

Storage happens **before** the email. If Resend is down the lead is still on disk, logged
as `stored as #N but not emailed`.

Both the enhanced and no-JS paths land on `/thanks/`, so conversion tracking has one URL
to watch.

## Content

Everything routine is Markdown in `src/content/`. Adding a post means adding a file — the
blog index, homepage list, sitemap and RSS feed all pick it up.

```md
---
title: "Post title"
description: "One line — this is the meta description."
pubDate: 2026-08-16
tags: ["SEO"]
draft: false
---
```

## Deploying

Target: Hetzner CAX11 in Nuremberg, with Cloudflare proxying in front.

**Once**, store a Hetzner API token (Read & Write) outside the repo:

```sh
mkdir -p ~/.config/hcloud
printf '%s' 'YOUR_TOKEN' > ~/.config/hcloud/token
chmod 600 ~/.config/hcloud/token
```

Then, in order:

```sh
# 1. Create the server (idempotent — safe to re-run)
bash deploy/provision-hetzner.sh

# 2. Add the two A records in Cloudflare as "DNS only" (grey cloud) first,
#    so Caddy's HTTP-01 challenge can reach the box.

# 3. Provision it
ssh root@<ip> 'bash -s' < deploy/setup-server.sh
ssh root@<ip> 'nano /etc/kastriottanaj/env'     # set SMTP_PASSWORD

# 4. First deploy
ssh root@<ip> 'sudo -u deploy /var/www/kastriottanaj/current/deploy/deploy.sh'
ssh root@<ip> 'systemctl enable --now kastriottanaj && systemctl reload caddy'

# 5. Once HTTPS serves cleanly, flip both records to "Proxied" (orange) and set
#    Cloudflare SSL/TLS to "Full (strict)".

# 6. Optional, after the proxy is live — restrict the origin to Cloudflare
bash deploy/cloudflare-lockdown.sh <ip>
```

The grey-cloud-first ordering is not optional: with Cloudflare proxying from the
start, Caddy cannot complete the HTTP-01 challenge and never gets a certificate.

After that, pushing to `main` deploys: GitHub Actions builds as a check, then SSHes in and
runs `deploy.sh`. Repo secrets needed: `SSH_HOST`, `SSH_USER`, `SSH_KEY`, optionally
`SSH_PORT`.

The build runs **on the server**, not in CI — same ARM64 architecture that runs it.

```sh
journalctl -u kastriottanaj -f     # API logs
systemctl status caddy             # web server
```

## Two things that will bite you

**`security.allowedDomains` in `astro.config.mjs` is load-bearing.** Astro rejects
cross-origin form POSTs by comparing the `Origin` header against the URL it reconstructs.
Behind Caddy the socket is plain HTTP, so without those entries the reconstructed origin
is `http://…`, the browser sends `https://…`, and every real submission 403s. Adding a
domain to the site means adding it there too.

**Hetzner blocks outbound ports 25 and 465** on new Cloud accounts. Hostinger SMTP uses
STARTTLS on port 587 instead. The server authenticates as `kastriot@kastriottanaj.com`;
keep its mailbox password only in `/etc/kastriottanaj/env`, never in this repository.

## Before launch

1. **Fill in the case studies.** `src/content/work/*.md` are structured but their bodies
   are `TODO` comments. Real numbers only — the placeholders say so deliberately.
2. **Review the blog drafts.** The three posts in `src/content/blog/` are written to be
   publishable but they are a starting draft, not your words yet.
3. **Add the CV.** `/assets/kastriot-tanaj-cv.pdf` is linked from the contact panel and
   does not exist yet.
4. **Swap the case-study placeholders for real screenshots.** Each is a `.thumb` figure —
   replacing the `<figcaption>` with an `<img>` makes the hatch pattern get out of the way
   automatically.
5. **Set the Hostinger mailbox password**, then send one real test enquiry end to end.
6. **Submit the sitemap** in Search Console: `https://kastriottanaj.com/sitemap-index.xml`.

## Design system

`src/styles/modernist.css` is vendored from the Claude Design project and should not be
hand-edited — re-export it instead. One edit was necessary: the upstream
`@import url(fonts.googleapis.com…)` was removed, because Archivo is now self-hosted at
build time and that import was a second render-blocking font request. Re-exporting means
removing that line again.

Type tokens are repointed at the self-hosted font in `site.css`:

```css
--font-heading: var(--font-archivo), system-ui, sans-serif;
```

Colour, type and spacing all come from `var(--…)` tokens. Retuning the `:root` block in
`modernist.css` moves the whole site at once.
