import nodemailer from "nodemailer";

/**
 * One SMTP transport and one email shell, shared by the lead notification, the
 * subscriber double opt-in mails, and scripts/send-newsletter.mjs.
 *
 * Plain JavaScript so the send script can import it under bare node.
 */

/** Hostinger authenticates the mailbox and rejects a mismatched From. */
export const FROM_ADDRESS = process.env.SMTP_USER ?? "kastriot@kastriottanaj.com";
export const FROM_NAME = process.env.MAIL_FROM_NAME ?? "Kastriot Tanaj";
export const SITE_URL = (process.env.PUBLIC_SITE_URL ?? "https://kastriottanaj.com").replace(/\/$/, "");

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Headers must not carry a newline — anything that reaches a Subject or a
 *  display name gets flattened first. */
export function headerSafe(value) {
  return String(value ?? "").replace(/[\r\n]+/g, " ").trim();
}

/**
 * Returns null when SMTP is not configured, so a missing password degrades to
 * "not sent" rather than a crash on a route a visitor is waiting on.
 *
 * @returns {import("nodemailer").Transporter | null}
 */
export function createTransport() {
  const host = process.env.SMTP_HOST ?? "smtp.hostinger.com";
  const port = Number(process.env.SMTP_PORT ?? "587");
  const password = process.env.SMTP_PASSWORD;

  if (!password || !Number.isInteger(port) || port < 1 || port > 65535) {
    console.warn("[mail] SMTP_PASSWORD is missing or SMTP_PORT is invalid — not sending");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: FROM_ADDRESS, pass: password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    tls: { minVersion: "TLSv1.2" },
  });
}

/**
 * The site's look, cut down to what mail clients actually honour: a fixed-width
 * table, web-safe fallbacks ahead of Archivo, and colours repeated inline
 * because Outlook drops most of a <style> block.
 *
 * @param {{ preheader?: string, bodyHtml: string, footerHtml?: string }} parts
 */
export function renderEmail({ preheader = "", bodyHtml, footerHtml = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin:0; padding:0; background:#f3f2f2; }
  .email-body { color:#201e1d; font-family:Archivo,Helvetica,Arial,sans-serif; font-size:16px; line-height:1.65; }
  .email-body h1, .email-body h2, .email-body h3 { font-weight:800; line-height:1.2; letter-spacing:-0.015em; margin:32px 0 12px; }
  .email-body h1 { font-size:26px; margin-top:0; }
  .email-body h2 { font-size:20px; }
  .email-body h3 { font-size:17px; }
  .email-body p { margin:0 0 16px; }
  .email-body ul, .email-body ol { margin:0 0 16px; padding-left:22px; }
  .email-body li { margin:0 0 8px; }
  .email-body a { color:#ae1800; }
  .email-body blockquote { margin:0 0 16px; padding:2px 0 2px 16px; border-left:3px solid #ec3013; color:#605d5d; }
  .email-body code { background:#eae9e9; padding:1px 5px; font-size:14px; }
  .email-body pre { background:#201e1d; color:#f3f2f2; padding:16px; overflow-x:auto; font-size:13px; }
  .email-body pre code { background:transparent; color:inherit; padding:0; }
  .email-body img { max-width:100%; height:auto; }
  .email-body hr { border:0; border-top:1px solid #d7d3d3; margin:32px 0; }
</style>
</head>
<body>
  <span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f2f2">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">
          <tr>
            <td class="email-body" style="background:#ffffff;padding:36px 32px;color:#201e1d;font-family:Archivo,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65">
${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 0;color:#605d5d;font-family:Archivo,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.7">
              ${footerHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** A dark, full-width button that survives Outlook. */
export function emailButton(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0">
  <tr><td style="background:#201e1d">
    <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;color:#f3f2f2;font-family:Archivo,Helvetica,Arial,sans-serif;font-weight:700;font-size:15px;text-decoration:none">${escapeHtml(label)}</a>
  </td></tr>
</table>`;
}
