# kastriottanaj.com

Astro site for Kastriot Tanaj — SEO, digital marketing and AI automation.

Static HTML at build time, a handful of server routes for lead capture and the
newsletter, deployed to a Hetzner Cloud box behind Caddy.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/client (static) + dist/server (the /api routes)
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
| Storage | SQLite via `node:sqlite` — leads and newsletter subscribers |
| Newsletter | Double opt-in, own list, sent from the same mailbox |
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
    bootcamps/        The paid courses — curriculum, tiers, FAQ
    newsletter/       Newsletter issues
    services/         The four service pages
    work/             Case studies
  content.config.ts   Collection schemas
  pages/
    api/              The server routes (prerender = false)
      lead.ts         Contact form
      subscribe.ts    Newsletter signup
      newsletter/     confirm.ts, unsubscribe.ts
    newsletter/       Landing page, archive, status pages, email artifacts
    bootcamps/        Index and the sales page for each bootcamp
    services/, work/, blog/
    robots.txt.ts, llms.txt.ts, rss.xml.ts
  lib/
    site.ts           Site-wide copy, nav, service allowlist
    sqlite.mjs        The one database connection
    db.ts             Lead writes
    newsletter-store.mjs   Subscribers, and who has had which issue
    mailer.mjs        SMTP transport and the shared email shell
    email.ts          Lead notification
    newsletter-email.mjs   Confirm, welcome and issue mails
    request.ts        Client IP, JSON-vs-redirect responses
    turnstile.ts      Optional captcha verification
    rate-limit.ts     Per-IP fixed window
  layouts/Base.astro  Head, meta, JSON-LD, nav, footer
  styles/
    modernist.css     Design system, vendored — see note below
    site.css          Page composition
scripts/
  send-newsletter.mjs Sends one issue to the confirmed list
deploy/
  Caddyfile           Static + reverse proxy + headers
  kastriottanaj.service
  setup-server.sh     One-time provisioning
  deploy.sh           Pull, build, restart, health-check, roll back on failure
  backup-leads.sh     Nightly SQLite backup (leads and subscribers alike)
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

Storage happens **before** the email. If SMTP is down the lead is still on disk, logged
as `stored as #N but not emailed`.

Both the enhanced and no-JS paths land on `/thanks/`, so conversion tracking has one URL
to watch.

## The newsletter

People subscribe from `/newsletter/`, the foot of every post, and the homepage. Every
address goes through double opt-in, and everything is sent from the same Hostinger
mailbox the contact form uses — no third-party sending service, no per-subscriber fee.

```
Browser ──POST /api/subscribe──▶  honeypot → rate limit → Turnstile → validate
                                             │
                                  subscribers row, status = pending
                                             │
                                  confirmation mail with a one-use token
                                             │
        GET /api/newsletter/confirm ──▶ status = confirmed, welcome mail
                                             │
        GET /api/newsletter/unsubscribe ──▶ status = unsubscribed
```

Nothing is ever sent to an address that has not confirmed. The same answer comes back
whether an address is new, already on the list, or inside the fifteen-minute resend
cooldown — a form that says "you are already subscribed" is a form that tells strangers
who is on your list.

### Writing and sending an issue

An issue is one Markdown file. It becomes both the email and its web version at
`/newsletter/archive/<slug>/`, so it is written once.

```md
---
subject: "The subject line, written for an inbox"
title: "Heading on the web version"
preheader: "The grey line an inbox shows after the subject."
description: "Meta description for the archived page."
pubDate: 2026-08-25
draft: false
---
```

Commit it, push, and let the deploy build. Then, **on the server**:

```sh
cd /var/www/kastriottanaj/current
set -a && source /etc/kastriottanaj/env && set +a

node scripts/send-newsletter.mjs my-issue --dry-run          # counts, renders, sends nothing
node scripts/send-newsletter.mjs my-issue --test you@you.com # one copy, to you
node scripts/send-newsletter.mjs my-issue                    # the real thing
```

Every delivery is recorded, so an interrupted run is resumed by running it again — nobody
gets the same issue twice. `--limit n` sends a first cautious batch, and `--rate n` sets
messages per minute (default 20; a mailbox that fires everything at once looks like a
compromised one).

The send reads `dist/client/newsletter/email/<slug>.json`, which the build writes from the
same Markdown. A draft has no such file, which is what makes drafts unsendable.

### Deliverability

The list is small and the sending mailbox is a real one, which is the easy case — but a
newsletter is bulk mail and gets judged like it.

- **SPF, DKIM and DMARC must all pass for kastriottanaj.com.** Hostinger publishes the
  SPF and DKIM records; add them in Cloudflare DNS and check with a test to
  `check-auth@verifier.port25.com` before the first real send.
- **Watch the mailbox's sending limits.** Hostinger caps messages per hour and per day on
  business mailboxes. Past a few hundred subscribers, either raise the plan's limit or
  move issues to a dedicated sending service — the subscriber list is yours either way,
  and `newsletter-email.mjs` is the only file that would change.
- **Never import a list you did not collect here.** One purchased list is enough to burn
  the domain that also sends your invoices.

Checking the list, without needing `sqlite3` installed:

```sh
node --input-type=module -e "
import { listStats } from './src/lib/newsletter-store.mjs';
console.log(listStats());
"
```

## Bootcamps

A bootcamp is one Markdown file in `src/content/bootcamps/`. It renders the whole sales
page — curriculum, pricing tiers, fit lists, FAQ and the `Course` structured data — so the
page is edited by editing frontmatter, not the template.

```md
---
title: "SEO Bootcamp"
headline: "The promise, above the fold."
format: "Self-paced · 10 modules · lifetime access"
workload: "PT14H"        # schema.org courseWorkload, ISO 8601
outcomes: [...]          # also becomes schema.org `teaches`
fit: [...]               # "this is for you if"
notFit: [...]            # and who it is not for
modules: [{ title, summary, lessons: [...] }]
tiers: [{ name, price, summary, features: [...], checkout }]
---
```

### Opening enrolment

**`checkout` is the switch.** A tier with a payment URL is on sale; a tier without one is
not, and the page says so honestly rather than pretending:

| | tier has `checkout` | tier has no `checkout` |
| --- | --- | --- |
| Button | "Enrol — €297", links to the payment page | "Join the waitlist", links to the signup form |
| `Offer.availability` | `InStock` | `PreOrder` |
| Page copy | "One payment, lifetime access…" | "Enrolment is not open yet…" |

So launching is one edit: paste the payment links into the tiers and deploy. There is no
second flag to remember, which is the point — a page that claims `InStock` for something
nobody can buy is how structured data gets ignored site-wide.

Payments are set to go through **Paysera** (the first EMI licensed by the Central Bank of
Kosovo, so the money lands in euros without a US intermediary). Each tier gets its own
payment link, and the link is the only thing this repository needs to know about it —
nothing here handles card data.

Waitlist signups go through the existing newsletter double opt-in, tagged with the source
`bootcamp-<slug>`, so it is visible later which page earned them.

### Before selling anything

- **Delivering the course is not built yet.** The sales page sells; where the lessons
  actually live — a hosted platform, or a member area on this box — is still open.
- **`testimonials` is deliberately empty.** Real quotes, from real people, with
  permission, or none. Invented social proof undoes everything the rest of the page is
  trying to earn.
- **Check the guarantee is one you will honour.** It is stated in the FAQ and again above
  the fold of the pricing section, and it is worded as a promise, not a hedge.
- **Distance selling means a refund right.** Fourteen days is already the EU baseline for
  digital goods bought at a distance; the copy commits to it plainly. Terms and a privacy
  note should be linked from the checkout before the first sale.

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
6. **Add SPF and DKIM for the sending domain**, then subscribe yourself and walk the whole
   newsletter loop once — confirm, receive, unsubscribe.
7. **Submit the sitemap** in Search Console: `https://kastriottanaj.com/sitemap-index.xml`.
8. **Decide how the bootcamp is delivered**, then paste the Paysera links into
   `src/content/bootcamps/seo-bootcamp.md`. Until then the page runs as a waitlist, which
   is a fine way to find out whether anyone wants it.

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
