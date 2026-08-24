import {
  createTransport,
  escapeHtml,
  headerSafe,
  renderEmail,
  emailButton,
  FROM_ADDRESS,
  FROM_NAME,
  SITE_URL,
} from "./mailer.mjs";

/**
 * Every mail a subscriber can receive: the double opt-in confirmation, the
 * welcome, and an issue of the newsletter itself.
 *
 * Plain JavaScript because scripts/send-newsletter.mjs builds issue mails with
 * the same code the site uses for everything else — one template, one footer,
 * one place to fix a broken unsubscribe link.
 */

const LIST_NAME = "Kastriot Tanaj — Tips & Tricks";

/** Both links are absolute and go through /api/, the only path Caddy proxies
 *  to Node (see deploy/Caddyfile). */
export function confirmUrl(token) {
  return `${SITE_URL}/api/newsletter/confirm?token=${encodeURIComponent(token)}`;
}

export function unsubscribeUrl(token) {
  return `${SITE_URL}/api/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

function signature() {
  return `<p style="margin:24px 0 0">— Kastriot<br>
<span style="color:#605d5d">SEO &amp; AI automation · <a href="${SITE_URL}/" style="color:#ae1800">kastriottanaj.com</a></span></p>`;
}

/**
 * Sent the moment someone submits the form. Until this link is clicked the
 * address receives nothing else, ever.
 */
export async function sendConfirmationEmail({ address, token }) {
  const transporter = createTransport();
  if (!transporter) return false;

  const link = confirmUrl(token);

  const html = renderEmail({
    preheader: "One click and you're on the list.",
    bodyHtml: `
<h1>Confirm your subscription</h1>
<p>Someone — hopefully you — asked for my tips and tricks on SEO, digital marketing and AI automation. Click below and you're in.</p>
${emailButton(link, "Yes, subscribe me")}
<p style="color:#605d5d;font-size:14px">If the button doesn't work, paste this into your browser:<br>
<a href="${escapeHtml(link)}" style="color:#ae1800;word-break:break-all">${escapeHtml(link)}</a></p>
<p style="color:#605d5d;font-size:14px">Didn't sign up? Ignore this email — nothing happens without that click, and I'll never write again.</p>
${signature()}`,
    footerHtml: `Sent by ${escapeHtml(FROM_NAME)}, ${escapeHtml(SITE_URL.replace(/^https?:\/\//, ""))}`,
  });

  const text = [
    "Confirm your subscription",
    "",
    "Someone - hopefully you - asked for my tips and tricks on SEO, digital",
    "marketing and AI automation. Open this link and you're in:",
    "",
    link,
    "",
    "Didn't sign up? Ignore this email. Nothing happens without that click.",
    "",
    "- Kastriot",
    SITE_URL,
  ].join("\n");

  try {
    await transporter.sendMail({
      from: `${FROM_NAME} <${FROM_ADDRESS}>`,
      to: address,
      subject: "Confirm your subscription — tips from Kastriot",
      text,
      html,
    });
    return true;
  } catch (error) {
    console.error("[newsletter] confirmation email failed:", error);
    return false;
  }
}

/** Sent once, immediately after the address confirms. */
export async function sendWelcomeEmail({ address, unsubscribeToken }) {
  const transporter = createTransport();
  if (!transporter) return false;

  const optOut = unsubscribeUrl(unsubscribeToken);

  const html = renderEmail({
    preheader: "You're on the list. Here's what to expect.",
    bodyHtml: `
<h1>You're in.</h1>
<p>Thanks for confirming. From here on you'll get short, practical notes on the things I do every day:</p>
<ul>
  <li>SEO that survives an algorithm update</li>
  <li>Marketing experiments worth copying — and the ones that wasted my time</li>
  <li>AI automations that quietly remove an hour of manual work a week</li>
</ul>
<p>No fixed schedule, no filler. I write when I have something worth your inbox.</p>
<p>In the meantime, the archive of longer pieces lives here:</p>
${emailButton(`${SITE_URL}/blog/`, "Read the insights")}
<p style="color:#605d5d;font-size:14px">Just hit reply if you have a question — it comes straight to me.</p>
${signature()}`,
    footerHtml: `You're getting this because you confirmed your subscription at ${escapeHtml(SITE_URL.replace(/^https?:\/\//, ""))}.<br>
<a href="${escapeHtml(optOut)}" style="color:#605d5d">Unsubscribe</a>`,
  });

  const text = [
    "You're in.",
    "",
    "Thanks for confirming. From here on you'll get short, practical notes on",
    "SEO, marketing experiments worth copying, and AI automations that remove",
    "an hour of manual work a week.",
    "",
    `Longer pieces live at ${SITE_URL}/blog/`,
    "",
    "Just hit reply if you have a question - it comes straight to me.",
    "",
    "- Kastriot",
    "",
    `Unsubscribe: ${optOut}`,
  ].join("\n");

  try {
    await transporter.sendMail({
      from: `${FROM_NAME} <${FROM_ADDRESS}>`,
      to: address,
      subject: "You're on the list",
      text,
      html,
      list: { unsubscribe: { url: optOut, comment: "Unsubscribe" } },
    });
    return true;
  } catch (error) {
    console.error("[newsletter] welcome email failed:", error);
    return false;
  }
}

/**
 * One issue, addressed to one subscriber. Pure — it builds the message and
 * hands it back, so the send script owns the transport, the pacing and the
 * bookkeeping.
 *
 * @param {{ issue: { slug: string, subject: string, preheader?: string, html: string, text: string, url: string }, unsubscribeToken: string }} input
 */
export function buildIssueEmail({ issue, unsubscribeToken }) {
  const optOut = unsubscribeUrl(unsubscribeToken);
  const host = SITE_URL.replace(/^https?:\/\//, "");

  const html = renderEmail({
    preheader: issue.preheader ?? "",
    bodyHtml: `${issue.html}\n${signature()}`,
    footerHtml: `You're getting this because you subscribed to ${escapeHtml(LIST_NAME)} at ${escapeHtml(host)}.<br>
<a href="${escapeHtml(issue.url)}" style="color:#605d5d">Read it in your browser</a> ·
<a href="${escapeHtml(optOut)}" style="color:#605d5d">Unsubscribe</a>`,
  });

  const text = [
    issue.text.trim(),
    "",
    "— Kastriot",
    SITE_URL,
    "",
    "---",
    `Read in your browser: ${issue.url}`,
    `Unsubscribe: ${optOut}`,
  ].join("\n");

  return {
    from: `${FROM_NAME} <${FROM_ADDRESS}>`,
    replyTo: FROM_ADDRESS,
    subject: headerSafe(issue.subject),
    text,
    html,
    list: {
      unsubscribe: { url: optOut, comment: "Unsubscribe" },
      help: { url: `${SITE_URL}/newsletter/`, comment: "About this newsletter" },
    },
    headers: {
      // Groups the whole list in a Gmail thread's "why am I getting this".
      "List-ID": `${LIST_NAME} <newsletter.${host}>`,
    },
  };
}
