# WordPress bootcamp keyword strategy

Research run 2026-09-08 against Ubersuggest, US market (locId 2840). This
document records what the data said, which readings turned out to be false, and
the page architecture we settled on. It is a reference — the writing itself is
not scaffolded here.

## The constraint everything is filtered through

`kastriottanaj.com` as Ubersuggest saw it on 2026-09-08:

| Metric | Value |
| --- | --- |
| Domain authority | 9 |
| Backlinks / referring domains | 52 / 49 |
| Ranking organic keywords | 0 |
| Monthly organic traffic | ~5 |

At DA 9 with nothing ranking yet, SEO difficulty above roughly 45 is not a
target, it is a wish. Every recommendation below is filtered on that.

## False readings, all caught by checking the SERP

Ubersuggest's difficulty score has now misled us three times. Every time, the
live SERP told the truth. **SERP-verify anything that looks unusually cheap
before committing a page to it.** The third case, and a timestamp tell that
helps predict which rows to check first, are in the question-keyword section
below.

- **`lawyer seo services`** — 1,300/mo, SD 26, $83.56 CPC. Looked like the find
  of the day. Actual page one: DA 41, 41, 58, 34, 38, 41, 39, 31, plus a
  three-result local pack. A wall of incumbents.
- **`wordpress online classes`** — 210/mo, SD **21**, against its own synonyms
  `wordpress online training` (SD 69) and `wordpress online course` (SD 67).
  The most attractive row in the whole export. Its SERP is the *same domains* as
  the SD-67 term: learn.wordpress.org 98, LinkedIn 99, Coursera 92, Udemy 92,
  Skillshare 85, HubSpot 93. Lowest DA on the page is 49. The SD 21 is simply
  wrong.

Also worth knowing: `wordpress online training` and `wordpress online course`
return byte-identical volume, CPC, competition and 13-month series. Google
clusters them as synonyms. They are one keyword, not two.

## The finding that decides the architecture

People who want to learn WordPress phrase the need two ways, and the two
phrasings live in completely different competitive worlds.

| Phrasing | Volume in export | Who owns the SERP |
| --- | --- | --- |
| Product words — course, training, classes | 1,400/mo | learn.wordpress.org 98, LinkedIn 99, Coursera 92, Udemy 92, Skillshare 85 |
| Task words — how to build / create a website | 2,930/mo | Reddit and brands, but **DA 37 independents rank** |

Same people, same need. The product-word SERPs are sealed by the organisation
that makes WordPress. The task-word SERPs seat independent blogs — raidboxes.io
(DA 37) at position 6, breakdance.com (DA 37) at 13, imarticus.org (DA 46) at 15.

You cannot outrank WordPress.org for "wordpress course". You can beat
raidboxes.io. So acquisition comes from task phrasing, not product phrasing.

## Targets

### Tier 1 — the pillar. One page, ~1,850/mo

These are one intent on one SERP, so they belong on a single page. Splitting
them would cannibalise.

| Keyword | Volume | SD | CPC |
| --- | --- | --- | --- |
| how to build a wordpress website | 1,300 | 40 | $10.22 |
| how to create a website through wordpress | 320 | 23 | $7.45 |
| how to build a website using wordpress | 140 | 70 | $4.71 |
| how to build a website through wordpress | 70 | 17 | $11.37 |
| how long does it take to build a wordpress website | 20 | 9 | — |

### Tier 2 — project spokes, ~240/mo. Only after the pillar shows movement

Higher-commitment learners, and each maps to a bootcamp module. Separate SERPs,
so separate posts.

| Keyword | Volume | SD | CPC |
| --- | --- | --- | --- |
| how to build a wordpress ecommerce website | 110 | 43 | $11.60 |
| how to create a wordpress blog website | 90 | 45 | $10.70 |
| how to create a wordpress membership site | 40 | 45 | — |

### Tier 3 — cheap authority builders, ~230/mo at SD 15–40

Batch these once there is a hub for them to point at: mobile friendly (70, SD
40), responsive (40, SD 40), going live (30, SD 39), password protection (30,
SD 38), `.org` site (20, SD 30), Elementor (10, SD 21), load speed (10, SD 15).

### For the landing page itself

`wordpress web design training` — 40/mo, **SD 16**. The only training-word
keyword in the entire export with a reachable difficulty, and it matches the
actual positioning. Belongs in `src/content/bootcamps/wordpress-bootcamp.md`.

## What to abandon

`wordpress online course` (SD 67) · `wordpress online training` (SD 69) ·
`wordpress online classes` (SD 21 but verified DA 85–99 wall) ·
`wordpress training free` (210, SD 61 — and "free" is the wrong audience for a
paid bootcamp) · `wordpress seo training` (170, SD 54) ·
`wordpress training course` (SD 67) · `wordpress developer training` (SD 69).

Keep `wordpress bootcamp` (50/mo, SD 31, declining) as the product name. It is
cheap to own and one DA 22 site ranks on it, but it will not bring traffic.

## Noise in the export — roughly 600/mo, about a third of the rows

Not the audience, and targeting any of it would poison a page's intent match.

- **Bootstrap CSS developers (320/mo)** — `wordpress bootstrap theme` (140),
  `bootstrap template` (90) and seven more. People wiring a CSS framework into
  WordPress.
- **Course *sellers* (160/mo)** — `wordpress training plugin` (90),
  `wordpress online course theme` (40), `wordpress online course template` (30).
  These want to *build* a course site. They are competitors, not students.
- **Existing users and job seekers (120/mo)** — `wordpress minimum
  requirements` (50), `wordpress entry level jobs` (40), `wordpress not
  loading` (30).

## Page architecture

The rule is **one page per SERP** — not one page per keyword, and not one page
for everything.

```
/bootcamps/wordpress-bootcamp          conversion. Already exists.
        ^                              Copy lives in the .md; the .astro is
        |                              layout only.
        | one honest link
        |
/blog/how-to-build-a-wordpress-website acquisition. The page to build.
        ^
        +-- phase 2 spokes link up: ecommerce / blog site / membership
```

Two pages doing two different jobs. The landing page targets product words and
will never rank for them; its job is conversion. The pillar post targets task
words and does the acquisition.

A single mega-page holding every cluster was considered and rejected: Tier 2
keywords sit on *different* SERPs, and a section inside an omnibus page cannot
win a SERP that expects a dedicated page on that subject.

Everything in every phase is a `.md` file in `src/content/blog/`. No new routes,
no new templates — `src/pages/blog/[slug].astro` already renders them.

Use the `metaTitle` / `metaDescription` frontmatter fields: `title` stays the
natural H1 and card copy, while the meta tags carry the keyword-exact phrasing.
No need to bend the headline to rank.

## Expectations

1,300/mo at SD 40 from DA 9, against Reddit, GoDaddy and Forbes, with an AI
Overview, a video block and People Also Ask occupying the top three slots before
any organic result. Realistic is 6–12 months to positions 8–15, which on that
SERP is perhaps 5–20 clicks a month at first.

The reason to do it anyway is that it is the only open door in the set, and it
compounds into the Tier 2 pages that carry the real buying intent.

One register note: **Reddit takes 129 clicks at position 4** on the pillar SERP,
beating GoDaddy, Forbes and HubSpot. People learning WordPress want a
practitioner's straight answer, not a funnel. A thin post written to point at
the bootcamp will neither rank nor convert.

## Question keywords — researched 2026-09-08

Second pass, same market (US, locId 2840), commercial and informational
modifiers kept separate. Everything below that is recommended was SERP-verified.

### A third false reading, and a tell worth reusing

- **`how do i install a wordpress plugin`** — 480/mo, SD **17**. The most
  attractive informational row in the pull. Its page one: wordpress.com 94,
  learn.wordpress.org 98, Reddit 92, GoDaddy 93, Kinsta 80, wpbeginner 79,
  YouTube 100, SiteGround 75. The lowest DA above position 12 is **75**. Same
  shape as `wordpress online classes`: a documentation wall the SD cannot see.
  Abandoned.

The tell that predicted it: Ubersuggest returns an `updated_at` per row, and the
untrustworthy scores share one stale bulk timestamp (`17728321xx`) with every
filler SD 4–5 row in the export. The rows that survived verification carry fresh
timestamps (`1783…`–`1788…`). **A low SD on a stale timestamp is a guess, not a
measurement.** It is not a substitute for checking the SERP, but it is a good
way to choose what to check first.

### The finding that changes the plan

`wordpress vs wix` and `wordpress vs squarespace` have **identical volume**
(1,900/mo each) and completely different SERPs.

| | `wordpress vs wix` | `wordpress vs squarespace` |
| --- | --- | --- |
| Volume / SD / CPC | 1,900 · SD 42 · $22.52 | 1,900 · SD 34 · $12.55 |
| Lowest DA on page one | **31** (cmsminds, #11) | **9** (arohavisuals, #6) |
| Who else is up there | tooltester 57, allaboutcookies 92, Zapier 82, G2 75, cybernews 69, wix.com 71 | saranguyenonline 18 (#5, 97 clicks), anaamelio.co 9 (#10), mercury 52, PCMag 92 |
| Verdict | affiliate review wall — skip | **open** |

Two DA 9 sites hold page one of a 1,900/mo commercial term. The higher Wix CPC
explains the difference: the affiliate money is in Wix, so review farms took that
SERP. The Squarespace comparison is answered by working designers and
freelancers, and Google is seating them above Squarespace's own page (#14).

This is the mirror image of the false readings — here the SD score reads
*harder* than the SERP actually is. The DA distribution is the gate in both
directions.

Supporting term, separately verified: **`wordpress vs squarespace seo`** —
70/mo, SD 31, with paigebrunton.com (DA 28) at #4 and seospace.co (DA 26) at
#10. Independents rank, and it is the one comparison angle that matches the SEO
positioning. Kept as a section of the main post for now; it earns its own post
only if the main post moves, since its SERP overlaps heavily.

`wordpress vs squarespace vs wix` (1,000/mo, SD 14) also verified reachable —
wpkraken.io 33 at #10, mightyink.co **DA 6** at #13. Genuinely open, but it is a
distinct three-way SERP, so it is a phase-2 post rather than a section.

### Landing page FAQ — verified, ~250/mo of reachable question volume

Answerable in two or three sentences and moves someone closer to buying. These
are now the FAQ questions in `src/content/bootcamps/wordpress-bootcamp.md`,
which already emits `FAQPage` schema.

| FAQ question (reworded) | Keyword it now targets | Volume | SD | SERP check |
| --- | --- | --- | --- | --- |
| Is WordPress hard to learn without any coding experience? | is wordpress hard to learn | 90 | 18 | **DA 9 at #13**, DA 25 at #11, DA 34 at #10 — open |
| | is wordpress easy to learn | 70 | 20 | same SERP, same page |
| How long does it take to learn WordPress and build the website? | how long does it take to learn wordpress | 30 | 18 | — |
| | how long does it take to build a wordpress website | 20 | 9 | — |
| How much does it cost to build a WordPress website beyond the course? | how much does it cost to build a wordpress website | 50 | 17 | softteco DA 36 at **#4** — open |
| Can I make money building WordPress websites for clients? | can you make money with wordpress | 30 | 24 | — |

The four answers were already written and were left untouched; only the question
phrasing changed.

**Three FAQ slots still to write** — the research supports them, the answers are
yours to write:

1. *Is WordPress worth learning in 2026?* → `is wordpress worth learning` (10,
   SD 5) + `should i learn wordpress` (10, SD 5)
2. *Is WordPress good for beginners?* → `is wordpress good for beginners` (20,
   SD 12)
3. *Should I use WordPress or Squarespace?* → carries comparison intent on the
   commercial page and is the honest internal link to the new post

### Blog post — scaffolded

`src/content/blog/wordpress-vs-squarespace.md`, `draft: true`, headings only.

- `title` is the natural H1; `metaTitle` / `metaDescription` carry the
  keyword-exact phrasing, per the convention already in use.
- No `image` / `imageAlt` yet — card art is needed before it publishes, or the
  index renders it text-only.
- Register matters more here than anywhere else in this document. Reddit takes
  652 clicks at position 2, and the independents that outrank Squarespace are
  personal and opinionated. A neutral feature table will not rank on this SERP,
  and a post that steers to the bootcamp in paragraph two will not either.

### Abandoned from this pass

`how do i install a wordpress plugin` (480, SD 17 — verified DA 75+ wall) ·
`what is wordpress used for` (720, SD 36 — Wikipedia 97, HubSpot 93, Hostinger
92; also the wrong intent, no buying signal) · `how much does wordpress cost`
(320, SD 56) · `what is a wordpress theme` (170, SD 62) · `wordpress vs wix`
(1,900, SD 42 — affiliate wall) · `why is my wordpress site slow` (10/mo) ·
`best way to learn wordpress` (30, SD 35 — borderline, and the SERP is course
sellers).

### How the two intents actually split

The commercial questions cluster tightly onto the landing page: they are short,
they are about cost, time, difficulty and payoff, and they are all reachable at
DA 9. The informational questions do not — `what is`, `how do i install`, `what
is a theme` are all owned by WordPress's own documentation and the encyclopedic
sites, at DA 75 and above.

So the answer to the question this research was opened to settle: **most of the
usable commercial intent does fit on the landing page**, roughly 250/mo of it,
because it is FAQ-shaped by nature. The one commercial question too big for a
FAQ entry is the platform comparison, and that is exactly the one with an open
SERP and a 1,900/mo head term.

## The cluster, as implemented 2026-09-10

Three posts feed one commercial page. Every keyword below was SERP-verified;
nothing is in the cluster on an SD score alone.

```
/bootcamps/wordpress-bootcamp/            hub — conversion
        ^            ^            ^
        |            |            |
  how-to-build   wordpress-vs   why-is-my-wordpress
  -a-wordpress   -squarespace   -site-slow
  -website
  1,300/mo SD40  1,900/mo SD34  90/mo SD15
  DA 37 ranks    DA 9 ranks     DA 23 ranks
        <----------> <---------->        siblings link across
```

### The mechanism

Linking is declared in frontmatter, not hand-maintained in prose, so a new post
joins the cluster without editing the others.

- `cluster` — keys into `src/lib/clusters.ts`, which holds the hub href and the
  CTA copy for the band at the foot of the post.
- `related` — sibling slugs, most relevant first. The rest of the cluster fills
  in behind them, newest first.
- `src/components/ClusterLinks.astro` renders the siblings and the hub link.
- `src/pages/blog/[slug].astro` swaps the site-wide CTA band for the cluster's
  own when a post declares one. Posts outside a cluster are untouched.

Two properties worth keeping:

- **A `related` slug that matches no post fails the build**, naming the post and
  the bad slug. Dead internal links cannot reach production.
- **A `related` slug that matches an unpublished post is skipped**, so the whole
  cluster can be scaffolded and cross-linked before any of it is written. Links
  appear as each post ships.

`how-to-optimize-website-images` is linked from the slow-site post but is *not*
a cluster member — it is a general SEO post and keeps its own CTA. `related`
works across clusters; membership only governs the CTA and the fill order.

### Staging

Tier 2 (ecommerce, blog site, membership) stays parked until the pillar shows
movement, per the rule above. Adding them now would spend effort on SD 43–45
SERPs before knowing whether the cluster ranks at all.

### Still needed before any of this publishes

The prose, and card art in `public/assets/blog/` — no post carries `image` /
`imageAlt` yet, so each renders a text-only card on the index. All three are
`draft: true`. Publishing them is a one-line change per file, and the sitemap
gate already accepts them (verified by building with all three published).
