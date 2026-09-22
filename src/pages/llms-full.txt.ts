import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { SITE, COMPANY, LEGAL_UPDATED } from "../lib/site";

/**
 * The full text of the site's content pages, as one markdown file — the
 * companion to llms.txt (see llmstxt.org). llms.txt is a map; this is the
 * territory. A model that can read this does not have to fetch and strip
 * twenty pages to find the sentence it wants to cite.
 *
 * Each entry leads with its canonical URL so a citation has somewhere to
 * point. Bodies are the source markdown, verbatim: the whole point of the
 * file is to hand a model the writing exactly as published.
 */
export async function GET(context: APIContext) {
  const site = (context.site ?? new URL(SITE.url)).origin;

  const services = (await getCollection("services")).sort((a, b) => a.data.order - b.data.order);
  const useCases = (await getCollection("useCases", ({ data }) => !data.draft)).sort(
    (a, b) => a.data.order - b.data.order
  );
  const bootcamps = (await getCollection("bootcamps", ({ data }) => !data.draft)).sort(
    (a, b) => a.data.order - b.data.order
  );
  const cases = (await getCollection("work", ({ data }) => !data.draft)).sort(
    (a, b) => a.data.order - b.data.order
  );
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  const iso = (d: Date) => d.toISOString().slice(0, 10);

  /** A titled list, or nothing — an empty heading is worse than no heading. */
  const section = (heading: string, items: string[]) =>
    items.length ? `\n## ${heading}\n\n${items.join("\n")}\n` : "";

  const faq = (items: { q: string; a: string }[]) =>
    section(
      "FAQ",
      items.map((f) => `**${f.q}**\n\n${f.a}\n`)
    );

  const titled = (items: { title: string; detail: string }[]) =>
    items.map((i) => `- **${i.title}** — ${i.detail}`);

  const bullets = (items: string[]) => items.map((i) => `- ${i}`);

  /**
   * One entry. Title is the page's own H1 — this file reproduces pages, so a
   * heading here should match the heading a reader sees there.
   */
  const entry = (opts: {
    title: string;
    url: string;
    meta: string[];
    lede?: string;
    body?: string;
    extra?: string;
  }) => {
    const head = [`# ${opts.title}`, "", `Source: ${site}${opts.url}`, ...opts.meta];
    // HTML comments are notes to whoever edits the file — where the real page
    // lives, what is and is not read from frontmatter. A browser never shows
    // them; this file must not either.
    const body = (opts.body ?? "").replace(/<!--[\s\S]*?-->/g, "").trim();
    const lede = opts.lede?.trim();
    const parts = [head.join("\n")];
    // A post whose description *is* its first paragraph would print it twice.
    if (lede && !body.startsWith(lede)) parts.push(lede);
    if (body) parts.push(body);
    if (opts.extra?.trim()) parts.push(opts.extra.trim());
    return parts.join("\n\n");
  };

  const divider = "\n\n---\n\n";

  const body = `# ${SITE.name} — full text

> ${SITE.description}

${SITE.jobTitle}, based in ${SITE.based}.

This file is the full text of every service, use case, bootcamp, case study and blog post on ${site}, in that order, followed by the legal pages. The site map with one line per page is at ${site}/llms.txt. Each entry below opens with its canonical URL.
${divider}${[
    ...services.map((s) =>
      entry({
        title: s.data.title,
        url: `/services/${s.id}/`,
        meta: ["Type: Service"],
        lede: s.data.description,
        body: s.body,
        extra: section("What's included", bullets(s.data.includes)) + faq(s.data.faq),
      })
    ),
    ...useCases.map((u) =>
      entry({
        title: u.data.title,
        url: `/use-cases/${u.id}/`,
        meta: ["Type: Use case", `Audience: ${u.data.audience}`],
        lede: u.data.description,
        body: u.body,
        extra:
          section("What is broken in this market", titled(u.data.problems)) +
          section("What I do about it", titled(u.data.plays)) +
          section("What the business can do afterwards", bullets(u.data.outcomes)) +
          faq(u.data.faq),
      })
    ),
    ...bootcamps.map((b) =>
      entry({
        title: b.data.title,
        url: `/bootcamps/${b.id}/`,
        meta: ["Type: Bootcamp", `Format: ${b.data.format}`],
        lede: [b.data.headline, b.data.description].join("\n\n"),
        body: b.body,
        extra:
          section("What you can do afterwards", bullets(b.data.outcomes)) +
          section("Who it is for", bullets(b.data.fit)) +
          section("Who it is not for", bullets(b.data.notFit)) +
          section(
            "Modules",
            b.data.modules.map(
              (m) =>
                `- **${m.title}** — ${m.summary}` +
                (m.lessons.length ? `\n${m.lessons.map((l) => `  - ${l}`).join("\n")}` : "")
            )
          ) +
          faq(b.data.faq),
      })
    ),
    ...cases.map((c) =>
      entry({
        title: c.data.title,
        url: `/work/${c.id}/`,
        meta: [
          "Type: Case study",
          `Client: ${c.data.client}`,
          ...(c.data.year ? [`Year: ${c.data.year}`] : []),
          ...(c.data.services.length ? [`Services: ${c.data.services.join(", ")}`] : []),
        ],
        lede: c.data.summary,
        body: c.body,
      })
    ),
    ...posts.map((p) =>
      entry({
        title: p.data.title,
        url: `/blog/${p.id}/`,
        meta: [
          "Type: Blog post",
          `Published: ${iso(p.data.pubDate)}`,
          ...(p.data.updatedDate ? [`Updated: ${iso(p.data.updatedDate)}`] : []),
          ...(p.data.tags.length ? [`Tags: ${p.data.tags.join(", ")}`] : []),
        ],
        lede: p.data.description,
        body: p.body,
      })
    ),
    // Unlike everything above, these two are not content-collection markdown —
    // the prose lives in src/pages/privacy.astro and terms.astro as JSX, so
    // there is no `body` to read. These summaries are therefore maintained by
    // hand: change either page and change the matching entry here. Entity
    // details and the date come from src/lib/site.ts, so those cannot drift.
    entry({
      title: "Privacy Policy",
      url: "/privacy/",
      meta: ["Type: Legal", `Last updated: ${LEGAL_UPDATED}`],
      lede: "What this site collects, why it collects it, who else sees it, and what you can ask us to do about it.",
      body: `## Who is responsible

${COMPANY.legalName}, a ${COMPANY.jurisdiction} ${COMPANY.entityType} trading as ${SITE.name} at kastriottanaj.com, is the data controller. ${SITE.name} runs it from ${SITE.locality}, ${SITE.countryName}, and the servers are in Germany. Contact: kastriot@kastriottanaj.com or ${SITE.phoneDisplay}. Registered office: ${COMPANY.registeredOffice}, c/o ${COMPANY.registeredAgent} — post there reaches the registered agent rather than us, so email is faster.

## The contact form

Collects name, email, the service selected and the message, and records IP address, user-agent and referrer alongside it. Written to a database on our own server and emailed as a notification; the database is the copy that lasts. Lawful basis: steps taken at your request before a possible contract, with the technical fields kept for security and abuse prevention as a legitimate interest.

## The newsletter

Stores the email address, the page subscribed from, IP address, user-agent and timestamps. Double opt-in — nothing is sent to an address that has not confirmed itself. Confirmed subscribers are passed to MailerLite, which delivers the emails. Lawful basis: consent, withdrawable at any time, and every email carries a working unsubscribe link.

## Analytics and advertising cookies

Nothing optional runs before you choose. Google Consent Mode defaults to denied and the Meta Pixel's script is not downloaded at all until you accept, so rejecting is the absence of a request rather than a promise. Accepting switches on Google Analytics 4 and the Meta Pixel. With advertising consent, a submitted lead is also sent to Meta's Conversions API from the server: email address and name are SHA-256 hashed before they leave, while IP address and user-agent are sent as they are, along with Meta's _fbp and _fbc cookies where present. Consent can be changed at any time through the Cookie settings link in the footer.

## Spam protection and server logs

Every form carries a hidden field real people never fill in, and submissions are rate-limited per IP address. Cloudflare Turnstile distinguishes people from bots. The web server keeps standard access logs — IP, timestamp, URL, referrer, user-agent — which roll over automatically. Lawful basis: legitimate interest in keeping the site usable and free of abuse.

## What this site does not do

Fonts are served from this domain, so visiting a page sends no request to Google Fonts. Personal data is neither sold nor bought. There is no automated decision-making and no profiling producing legal effects.

## Who else processes the data

Hetzner hosts the server and database in Germany. MailerLite delivers the newsletter from Lithuania, with EU-only sub-processors. Hostinger relays outgoing email. Google (Analytics), Meta (Pixel and Conversions API) and Cloudflare (Turnstile) are in the United States. The processors holding data at rest are in the EU, so leads and the subscriber list stay inside it; the US providers rest on the Standard Contractual Clauses in their published processing terms, and neither Google nor Meta is reached without consent. Article 28 agreements are in force with Hetzner and MailerLite.

## How long it is kept

Contact form enquiries: 24 months after the last contact, then deleted. Newsletter subscribers: until they unsubscribe, with unconfirmed subscriptions discarded rather than kept. Server access logs roll over on a short cycle and are not archived. Analytics and advertising data sit under Google's and Meta's own retention settings.

## Your rights

Access, rectification, erasure, restriction, objection and portability, plus withdrawal of consent at any time — through the footer link for cookies, through any unsubscribe link for the newsletter — without affecting what was lawful beforehand. Requests to kastriot@kastriottanaj.com are answered within one month. Complaints can go to a data protection supervisory authority, in the EU the one where you live or work.`,
    }),
    entry({
      title: "Terms & Conditions",
      url: "/terms/",
      meta: ["Type: Legal", `Last updated: ${LEGAL_UPDATED}`],
      lede: "The terms you accept by using this site, and where a separate agreement takes over instead.",
      body: `## Who these terms are with

${COMPANY.legalName}, a ${COMPANY.jurisdiction} ${COMPANY.entityType} trading as ${SITE.name} at kastriottanaj.com. Formal legal notices may be served on the registered agent, ${COMPANY.registeredAgent}, ${COMPANY.registeredOffice}; anything that is not formal service should go to kastriot@kastriottanaj.com, which reaches a person.

## The site is information, not an offer

Services, packages, prices and results described on the site are informational. Nothing there is a binding offer, and publishing a price does not oblige us to accept a project at it. Paid work begins only once a scope is agreed in writing, and where that agreement and these terms disagree, the agreement wins.

## Case studies and results

Outcomes shown happened for those clients, in their markets, with their budgets and constraints. They are evidence of past work, not a forecast. Search and advertising results depend on factors outside our control, and no rankings, traffic or revenue are guaranteed.

## Using the site

You agree not to submit false information or another person's details, attempt to break, overload or gain unauthorised access to the site or its server, scrape it in ways that degrade it for others, or use the forms to send unsolicited commercial messages. Forms are rate-limited and protected against automated abuse, and access that breaches these terms may be blocked.

## Intellectual property

Text, design, code, images and video are ours or used with permission, and are protected by copyright. Client names and logos belong to their owners and appear with agreement. Reading, linking and short quotation with attribution are fine; republishing substantial parts is not. Rights in work produced under a client engagement are governed by that engagement.

## Newsletter, bootcamps and the community

Subscribing is free and confirmed by email first, with a working unsubscribe link in every issue. Bootcamps and the community are described ahead of opening and those descriptions may change; joining either is subject to its own terms and pricing at the time, together with the terms of any third-party platform it runs on.

## Links, availability and liability

Links to other sites are not under our control and we are not responsible for their content or data handling. The site is provided as it is, with no promise that it will be uninterrupted or error-free. To the extent the law allows, we are not liable for indirect or consequential loss, lost profit, lost revenue or lost data. Nothing limits liability for death or personal injury caused by negligence, for fraud, or for anything else that cannot lawfully be limited. Liability for paid work is governed by the written agreement.

## Governing law

The laws of the State of ${COMPANY.jurisdiction}, ${COMPANY.country}, with the courts of ${COMPANY.jurisdiction} having jurisdiction. Consumers in the EU or the UK keep the mandatory protections of the country they live in whatever this page says, and may be able to bring proceedings in their own local courts.

## Privacy

How the site handles personal data is set out in the Privacy Policy at ${site}/privacy/, which forms part of these terms.`,
    }),
  ].join(divider)}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
