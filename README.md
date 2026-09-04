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
| Newsletter | Double opt-in, own SQLite list, optionally handed to MailerLite |
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
    mailerlite.mjs    MailerLite API client — optional, off without a key
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
  send-newsletter.mjs Sends one issue to the confirmed list (SMTP path)
  mailerlite-sync.mjs Hands the existing SQLite list to MailerLite, once
  mailerlite-check.mjs Proves the key works and prints the group ids
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

**Enquiries do not go to MailerLite.** Someone asking about a project has consented to an
answer, not to a newsletter, and a marketing list built out of a contact form is the kind
of thing GDPR is about. If they should be on the list, the honest route is a checkbox on
the form that says so — which does not exist yet.

## The newsletter

People subscribe from `/newsletter/`, the foot of every post, and the homepage. Every
address goes through double opt-in, and every submission is written to SQLite on this box
first — that table is the backup nobody else can switch off.

Where the mail comes from depends on one environment variable. Without
`MAILERLITE_API_KEY` the site does the whole job itself, from the same Hostinger mailbox
the contact form uses. With it, MailerLite becomes the list of record: the address lands
in the dashboard, MailerLite sends the opt-in mail, and automations run from there.

```
Browser ──POST /api/subscribe──▶  honeypot → rate limit → Turnstile → validate
                                             │
                                  subscribers row, status = pending
                                             │
                       ┌─────────────────────┴─────────────────────┐
              MailerLite configured                     no MailerLite key
                       │                                           │
        POST /subscribers, status=unconfirmed        confirmation mail from here,
        MailerLite mails them, automation runs       one-use token in the link
                       │                                           │
                       │                    GET /api/newsletter/confirm ──▶ confirmed
                       │                                           │
                       └──────────── unsubscribe ──────────────────┘
                        GET /api/newsletter/unsubscribe ──▶ removed in both
```

Nothing is ever sent to an address that has not confirmed. The same answer comes back
whether an address is new, already on the list, or inside the fifteen-minute resend
cooldown — a form that says "you are already subscribed" is a form that tells strangers
who is on your list.

Nothing is pushed to MailerLite for an address that is already confirmed or inside that
cooldown, because re-pushing as `unconfirmed` would knock a confirmed contact back to
unconfirmed and mail them a second link. Someone filling the form again months later is
the same trap from the other side — their confirmation happened in MailerLite, so the row
here still reads `pending` — so a submission from an address already handed over is looked
up in MailerLite first, and left alone if it is live there or if the lookup fails.

### Connecting MailerLite

Steps 1–6 are in the MailerLite dashboard, 7–9 on the server.

1. **Verify the sending domain.** MailerLite will not send the confirmation mail until
   `kastriottanaj.com` is authenticated there (its own SPF/DKIM records, alongside
   Hostinger's). Until it is done, either leave the key unset or set
   `MAILERLITE_OPT_IN=site` so this box keeps sending the opt-in mail.
2. **Turn on double opt-in for the API.** Account settings → Subscribe settings →
   **"Double opt-in for API and integrations"** → ON. Without it, an address pushed as
   `unconfirmed` sits in the dashboard in silence and nobody ever gets a link. This is the
   one setting that breaks signups if it is missed.
3. **Point the confirmation page back here.** Same screen, the "confirmation thank you
   page" tab → "Or use your own landing page" → `https://kastriottanaj.com/newsletter/confirmed/`.
4. **Make a group** for the list — Subscribers → Groups. Its id is the number in the URL,
   `/subscribers/groups/<id>`.
5. **Build the welcome automation** on that group, trigger "when a subscriber joins a
   group". The site stops sending its own welcome mail as soon as the key is set, so this
   automation *is* the welcome from then on.
6. **Add a "Signup source" custom field** (Subscribers → Fields, type text, key
   `signup_source`). Signups carry the page they came from — `homepage`, `blog-footer`,
   `bootcamp-seo-bootcamp` — which is what segments are built from later. It cannot be
   called `source`: MailerLite reserves that for its own "added via" attribute, which says
   `api` for every contact this site pushes and answers nothing useful. A missing field
   costs nothing either way — the push retries without it.
7. **Generate the API key**, Integrations → MailerLite API → Generate new token. It is
   shown once. Two lines go into `/etc/kastriottanaj/env` — the file systemd reads, which
   is the whole connection between the site and the account:

   ```sh
   sudo nano /etc/kastriottanaj/env       # root-owned, chmod 600 — never in the repo
   ```
   ```
   MAILERLITE_API_KEY=eyJ0…
   MAILERLITE_GROUP_ID=123456
   ```

   `EnvironmentFile` is read at service start and nowhere else, so the site keeps running
   on its own list until it is restarted:

   ```sh
   sudo systemctl restart kastriottanaj
   ```

8. **Check the connection** before trusting a form to it:

   ```sh
   cd /var/www/kastriottanaj/current
   set -a && source /etc/kastriottanaj/env && set +a
   node scripts/mailerlite-check.mjs
   ```

   One API call, nothing written. It says whether the key is live, lists every group with
   its id, marks the one this site pushes to, and exits non-zero if that id is missing or
   names a group the account does not have — which is the failure that would otherwise
   show up as every signup quietly 422ing.

9. **Hand over the list you already have**, on the server:

   ```sh
   cd /var/www/kastriottanaj/current
   set -a && source /etc/kastriottanaj/env && set +a

   node scripts/mailerlite-sync.mjs --dry-run   # counts and a sample, sends nothing
   node scripts/mailerlite-sync.mjs             # the real thing
   ```

   Confirmed addresses go over as `active` carrying their original signup date, and
   addresses that unsubscribed here go over as `unsubscribed` — the half of an import
   people forget, and the half that stops you mailing someone who already left. It is
   idempotent, so a failed run is fixed by running it again. `--include-pending` also
   pushes addresses that never confirmed, which makes MailerLite mail every one of them.

Then subscribe yourself from `/newsletter/` and watch the address appear in the dashboard.

`MAILERLITE_OPT_IN=site` is the escape hatch: it keeps this site's own confirmation mail
and `/newsletter/confirmed/` page, and pushes to MailerLite only once an address has
confirmed here. Useful before step 1 is done.

**What the key does not change:** the SQLite table still records every signup, and the
unsubscribe links inside mails already delivered still work — a click on one now removes
the address from MailerLite too. The gap runs the other way. An unsubscribe made *inside*
MailerLite is not mirrored back into SQLite, so that table drifts into claiming someone is
still confirmed. Nothing sends from it while MailerLite is configured (see below), so
nobody is mailed in error; closing the loop properly means a MailerLite webhook, which
does not exist here yet.

### Writing and sending an issue

An issue is one Markdown file. It becomes both the email and its web version at
`/newsletter/archive/<slug>/`, so it is written once.

**With MailerLite configured, the campaign is written in MailerLite** and the Markdown
file's job is the archived web version. `send-newsletter.mjs` refuses a real broadcast
while `MAILERLITE_API_KEY` is set — the same issue arriving twice is how a list learns to
unsubscribe — and `--dry-run`, `--test` and `--force` are the ways past it.

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
  SPF and DKIM records; add them in **Hostinger's DNS zone** (hPanel → Domains → DNS
  Zone — that is where this domain's nameservers point) and check with a test to
  `check-auth@verifier.port25.com` before the first real send.
- **Watch the mailbox's sending limits** on the SMTP path. Hostinger caps messages per
  hour and per day on business mailboxes, which is the ceiling MailerLite exists to lift.
- **Authenticate the domain twice** once MailerLite is live: Hostinger's records for the
  mail this box sends, MailerLite's for the campaigns. Both publish SPF and DKIM entries
  that have to coexist in Hostinger's DNS zone, and a campaign that fails DKIM is a
  campaign in the spam folder.
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

Target: Hetzner CAX11 in Nuremberg. **DNS lives at Hostinger** (`ns1`/`ns2.dns-parking.com`)
and the apex resolves straight to the box — there is no Cloudflare proxy in front, whatever
step 5 below once intended. Caddy terminates TLS itself.

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

# 2. Point kastriottanaj.com and www at the IP with A records — today that is
#    Hostinger's DNS zone. Unproxied, so Caddy's HTTP-01 challenge reaches the box.

# 3. Provision it
ssh root@<ip> 'bash -s' < deploy/setup-server.sh
ssh root@<ip> 'nano /etc/kastriottanaj/env'     # set SMTP_PASSWORD

# 4. First deploy
ssh root@<ip> 'sudo -u deploy /var/www/kastriottanaj/current/deploy/deploy.sh'
ssh root@<ip> 'systemctl enable --now kastriottanaj && systemctl reload caddy'

# 5. Optional, and NOT in use: move DNS to Cloudflare and proxy both records.
#    Three things change together, or not at all — see "Who the visitor is" below.
```

If you ever do adopt Cloudflare, add the records grey-cloud first: with the proxy on from
the start, Caddy cannot complete the HTTP-01 challenge and never gets a certificate.

After that, pushing to `main` deploys: GitHub Actions builds as a check, then SSHes in and
runs `deploy.sh`. Repo secrets needed: `SSH_HOST`, `SSH_USER`, `SSH_KEY`, optionally
`SSH_PORT`.

**`deploy/Caddyfile` is not part of that.** Nothing copies it to the server — a change here
is a no-op until it is installed by hand:

```sh
scp deploy/Caddyfile root@<ip>:/etc/caddy/Caddyfile
ssh root@<ip> 'caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile && systemctl reload caddy'
```

### Who the visitor is

Behind Caddy every socket address is `127.0.0.1`, so the visitor's IP has to come from a
header — and exactly one is trusted.

**`X-Forwarded-For` is trusted**, because Caddy ignores the client's value for every
`X-Forwarded-*` header unless `trusted_proxies` is configured, and it is not. What reaches
Node is Caddy's own, written from the TCP peer: one entry, not a list a visitor can prepend
to.

**`CF-Connecting-IP` is stripped** in the Caddyfile and no longer read by `clientIp()`. It
is not an `X-Forwarded-*` header, so Caddy hands it over verbatim, and this domain resolves
straight to the box. Until 2026-09-04 it was read *first*, which meant anyone could choose
their own identity for the per-IP rate limit on `/api/lead` and `/api/subscribe`, and choose
the IP recorded with every lead, every subscriber, and every MailerLite opt-in.

Adopting Cloudflare later means changing three things **together**:

1. read `CF-Connecting-IP` again in `clientIp()` — it is the only header Cloudflare rewrites
   on every request
2. drop `header_up -CF-Connecting-IP` from the Caddyfile
3. run `deploy/cloudflare-lockdown.sh` so the origin answers only Cloudflare's ranges

Doing 1 and 2 without 3 restores the hole exactly as it was. The header is worth nothing
unless Cloudflare is the only thing that can reach port 443.

The build runs **on the server**, not in CI — same ARM64 architecture that runs it.

```sh
journalctl -u kastriottanaj -f     # API logs
systemctl status caddy             # web server
```

### When the Deploy job goes red but the site is fine

*Resolved — kept because the symptom is confusing and the wrong diagnosis is tempting.*

GitHub intermittently answered the **anonymous** `git-upload-pack` POST from this box with
`401`, and `deploy.sh`'s fetch then died with `could not read Username for
'https://github.com'`. It is not this repo and not the protocol version — a public repo
clones the same way from that IP, and `git ls-remote` never reproduces it because it only
does the `GET /info/refs`, which answers 200 anonymously. It is GitHub throttling
anonymous git traffic from the address.

Nothing is at risk when it happens: the fetch is the first step, before `git reset
--hard`, so a failed deploy leaves the running site exactly as it was — just not updated.

`deploy.sh` also retries the fetch five times. To finish a deploy by hand:

```sh
ssh deploy@<ip> 'cd /var/www/kastriottanaj/current && ./deploy/deploy.sh'
```

**Fixed at the cause on 2026-09-02:** the box now fetches over SSH with its own
read-only deploy key, and authenticated traffic is not throttled this way — six
consecutive fetches passed where anonymous was a coin flip. `setup-server.sh` sets this
up, so a fresh box gets it too. The retry stays as a backstop for ordinary network blips.

The one manual step is registering the key, because only a repo admin can. `setup-server.sh`
generates it, prints it, and leaves `origin` on HTTPS until it is registered:

```sh
gh repo deploy-key add <the printed key> --title 'kastriottanaj-web'   # run locally
ssh root@<ip> 'bash -s' < deploy/setup-server.sh                        # re-run; flips origin
```

Keep it **read-only** — the deploy only ever reads. Verify with `gh repo deploy-key list`.
The clone in `setup-server.sh` still runs over HTTPS on purpose: it happens before any key
exists on the box.

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
   newsletter loop once — confirm, receive, unsubscribe. If MailerLite is doing the
   sending, walk it again after connecting it: its confirmation mail, its automation, and
   the unsubscribe link in a real campaign.
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
