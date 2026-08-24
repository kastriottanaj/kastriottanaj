import { createTransport, escapeHtml, headerSafe, FROM_ADDRESS, FROM_NAME } from "./mailer.mjs";

/** Lead notifications sent through the Hostinger mailbox over STARTTLS. */

export interface LeadEmail {
  name: string;
  email: string;
  service: string;
  message: string;
}

/** Resolves false when delivery fails — the caller has already stored the lead. */
export async function sendLeadEmail(lead: LeadEmail): Promise<boolean> {
  const to = process.env.LEAD_TO_EMAIL ?? FROM_ADDRESS;

  const transporter = createTransport();
  if (!transporter) return false;

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
    await transporter.sendMail({
      from: `${FROM_NAME} Website <${FROM_ADDRESS}>`,
      to,
      replyTo: lead.email,
      subject: `New enquiry — ${headerSafe(lead.name)} (${lead.service})`,
      text,
      html,
    });

    return true;
  } catch (error) {
    console.error("[email] Hostinger SMTP send failed:", error);
    return false;
  }
}
