# TODO

What is still open on kastriottanaj.com, and the traps worth knowing before
touching the server. Last reviewed 23 September 2026.

---

## 1. Legal — four questions for a lawyer

`/privacy/` and `/terms/` are live. None of the items below makes a statement on
those pages untrue — each is a question of whether a clause holds up, or whether
an extra obligation applies. Each one has a `TODO(legal)` comment beside the
clause it affects.

### 1.1 EU representative under GDPR Art. 27 — probably required

The controller is a US company with no EU establishment, so Art. 27 applies
unless the 27(2) exemption fits. That exemption needs processing to be
*occasional*. A permanently available lead form and newsletter aimed largely at
EU clients is regular and deliberate, so the exemption looks like a poor fit.

**If one is appointed:** name them in `src/pages/privacy.astro`, under
*Who is responsible*.

### 1.2 Which supervisory authority to name — follows from 1.1

With a US controller and no EU establishment there is no single lead authority.
Complaints go to the authority where the complainant lives, or to the one in the
member state where an Art. 27 representative sits. Settle 1.1 first, then word
the *Your rights* section to match.

### 1.3 Does the liability cap survive?

It has to work against both Delaware law and the mandatory consumer protections
of the European countries we sell into. Caps are the clause most often struck
out. An LLC limits personal exposure; it does not make the clause enforceable.

### 1.4 Is a Delaware governing-law clause worth keeping?

It is the natural default now the company is formed there, but most clients are
EU businesses and consumers, against whom a Delaware forum clause is of limited
practical use. Keep, change, or drop.

### 1.5 Hostinger DPA — smaller version of the Hetzner gap

Hostinger relays form notifications over SMTP, so lead names, emails and messages
pass through it: that makes them a processor, and Art. 28 wants a written
agreement. Much smaller than the Hetzner gap was — the mail is transient rather
than stored — but worth checking whether they offer one to accept.

**Done already:** Hetzner's DPA accepted in the customer portal. MailerLite's
forms part of their Terms of Use, so it was already concluded.

### 1.6 Delaware certificate — confirm on arrival

The pages name Marketing Chains LLC as controller and contracting party. Under
6 Del. C. § 18-201 an LLC is formed when the certificate is *filed*, not when the
stamped copy arrives, so this is sound today. Confirm the filing was accepted
when the paperwork lands.

---

## 2. Worth doing, no deadline

- **`npm run check:contrast`.** A browser-based audit found 48 WCAG AA failures
  that static review missed entirely — walking every rendered text node and
  comparing computed colour against computed background. It currently exists only
  as a throwaway script. Making it a checked-in command next to `check:csp` would
  catch the next stray red in CI instead of a person noticing.
- **Case-study videos are 10–12 MB** (`as-real-estate` 12M, `sts-bau` 11M,
  `gerti-foods` 10M). `preload="none"` means they cost nothing until played, so
  this only matters if play-to-first-frame should be faster.
- **`RESEND_API_KEY` in `/etc/kastriottanaj/env` is unused.** Nothing reads it —
  mail goes through nodemailer over SMTP. A live key with no purpose; worth
  revoking at Resend.
- **`uv_interface_addresses` unhandled rejection.** Logged twice at every service
  restart, never afterwards, no effect on request handling. Benign, but it is an
  unhandled rejection in production.

---

## 3. Traps — read before touching the server

### 3.1 The Caddyfile is not deployed by CI

`deploy/Caddyfile` is copied to `/etc/caddy/Caddyfile` only by
`deploy/setup-server.sh`, which runs once at provisioning. `deploy.sh` and the
GitHub Actions workflow pull, build and restart Node — they never touch Caddy. A
committed Caddyfile change therefore lands in `current/deploy/` and **silently
does nothing**. `deploy.sh` reports the drift at the end of every run without
failing.

Always diff first, because the live file may hold drift you are about to discard:

```sh
ssh root@46.224.183.175 'diff /etc/caddy/Caddyfile /var/www/kastriottanaj/current/deploy/Caddyfile'
```

Install the **whole file** — never patch it in place:

```sh
scp deploy/Caddyfile root@46.224.183.175:/tmp/Caddyfile.new
ssh root@46.224.183.175 'cp -a /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak.$(date +%Y%m%d-%H%M%S) && install -m 644 /tmp/Caddyfile.new /etc/caddy/Caddyfile && caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile && systemctl reload caddy'
```

A `sed` substitution against the live file turned `…ENOwvk='` into `…ENOwvk=.`
on 2026-09-22 — a `.` wildcard in the pattern, a literal `.` in the replacement —
and silently broke a working CSP hash. Edit the repo file, install it whole,
`diff -q` afterwards.

### 3.2 A `PUBLIC_*` var can add an inline script CI cannot see

`npm run check:csp` hashes the inline scripts a build actually emits. Setting
`PUBLIC_TURNSTILE_SITE_KEY` made `ContactForm.astro` emit a fourth one, and that
script exists **only where the var is set** — the server. CI and a laptop both
passed while the enforced policy blocked the live widget; with a valid secret in
place, `verifyTurnstile` then rejected every submission.

After changing anything gated behind a `PUBLIC_*` var, run the check where the
var is set:

```sh
ssh root@46.224.183.175 'cd /var/www/kastriottanaj/current && sudo -u deploy npm run check:csp'
```

Locally that same check now reports the Turnstile hash as "unused, could be
dropped". That advice is wrong. It exits 0, so CI stays green.

### 3.2b The legal pages appear in three places, one of them by hand

`/privacy/` and `/terms/` are indexable, so `check:sitemap` requires each to be
in **both** a sitemap and `llms.txt` — dropping `noindex` without adding both
fails the build. Three files move together: the page, `sitemap-pages.xml.ts`,
and `llms.txt.ts`.

`llms-full.txt` is the exception nothing enforces. Every other entry there reads
its body from a content collection, but these two are `.astro` prose with no
`body` to read, so the summaries in `llms-full.txt.ts` are **maintained by
hand**. Change either page and change the matching entry. Entity details and the
date interpolate from `src/lib/site.ts` (`COMPANY`, `LEGAL_UPDATED`), so those
cannot drift — only the narrative can.

Bump `LEGAL_UPDATED` in `src/lib/site.ts` whenever either page's substance
changes; it feeds both pages and `llms-full.txt`.

### 3.3 `/etc/kastriottanaj/env` must be mode 640

Owner `root`, group `deploy`. At 600 the deploy user cannot read it, the
readability test in `deploy.sh` fails, and the build silently runs **without**
`PUBLIC_*` vars — so a site key never reaches the HTML. Only `PUBLIC_TURNSTILE_SITE_KEY`
has no fallback, so Turnstile is the one thing that breaks.

### 3.4 Turnstile fails closed

`verifyTurnstile` short-circuits to `true` only when `TURNSTILE_SECRET_KEY` is
**unset**. Any non-empty value — including a placeholder — means real
verification, and a missing token is rejected. Never set the secret without the
site key, and never set either without rebuilding.

To disable Turnstile quickly, comment out both keys and redeploy: the honeypot
and the per-IP rate limit keep working on their own.

### 3.5 Verify with a browser, not a status code

A 200 proves the page served, not that the page works. Under an enforced CSP,
check that the tags actually survived:

- `typeof gtag === 'function'` and `dataLayer.length > 0`
- `fbq.loaded === true` — the real check, because the `fbq` stub exists even when
  `fbevents.js` was blocked
- the `securitypolicyviolation` DOM event, which fires under report-only too, so
  it predicts exactly what enforcing would block

---

## Done

Favicon · cookie-banner buttons · WCAG AA contrast (brand red plus 48 further
failures) · dead `--color-accent-2` ramp and `.text-muted` · CSP enforced in
production · Cloudflare Turnstile live and verified end to end · Privacy Policy
and Terms published.

Already passing before any of this: secrets handling, HTTPS and HSTS, meta
titles and descriptions, share cards, sitemap and robots, image alt text, image
compression, page weight, mobile layout, custom 404, internal links, form
validation, analytics with Consent Mode v2, and a single clear CTA.
