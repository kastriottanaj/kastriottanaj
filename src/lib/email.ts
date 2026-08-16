import nodemailer from "nodemailer";

/** Lead notifications sent through the Hostinger mailbox over STARTTLS. */

export interface LeadEmail {
  name: string;
  email: string;
  service: string;
  message: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Resolves false when delivery fails — the caller has already stored the lead. */
export async function sendLeadEmail(lead: LeadEmail): Promise<boolean> {
  const host = process.env.SMTP_HOST ?? "smtp.hostinger.com";
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER ?? "kastriot@kastriottanaj.com";
  const password = process.env.SMTP_PASSWORD;
  const to = process.env.LEAD_TO_EMAIL ?? "kastriot@kastriottanaj.com";

  if (!password || !Number.isInteger(port) || port < 1 || port > 65535) {
    console.warn("[email] SMTP_PASSWORD is missing or SMTP_PORT is invalid — skipping send");
    return false;
  }

  const text = [
    `Name:    ${lead.name}`,
    `Email:   ${lead.email}`,
    `Service: ${lead.service}`,
    "",
    lead.message,
  ].join("\n");

  const html = `
    <table cellpadding="6" style="font-family:system-ui,sans-serif;font-size:14px">
      <tr><td><strong>Name</strong></td><td>${escapeHtml(lead.name)}</td></tr>
      <tr><td><strong>Email</strong></td><td><a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a></td></tr>
      <tr><td><strong>Service</strong></td><td>${escapeHtml(lead.service)}</td></tr>
    </table>
    <hr>
    <p style="font-family:system-ui,sans-serif;font-size:14px;white-space:pre-wrap">${escapeHtml(lead.message)}</p>
  `;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user, pass: password },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      tls: { minVersion: "TLSv1.2" },
    });

    await transporter.sendMail({
      // Hostinger expects the sender to match the authenticated mailbox.
      from: `Kastriot Tanaj Website <${user}>`,
      to,
      replyTo: lead.email,
      subject: `New enquiry — ${lead.name.replace(/[\r\n]+/g, " ")} (${lead.service})`,
      text,
      html,
    });

    return true;
  } catch (error) {
    console.error("[email] Hostinger SMTP send failed:", error);
    return false;
  }
}
