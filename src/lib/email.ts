/**
 * Lead notifications via the Resend HTTP API.
 *
 * Deliberately not SMTP: Hetzner blocks ports 25 and 465 on new Cloud accounts,
 * and a VPS IP has no sender reputation to speak of. An API call over 443 sends
 * from a domain that actually passes SPF/DKIM.
 *
 * Uses fetch rather than the Resend SDK — one less dependency for one endpoint.
 */

const API = "https://api.resend.com/emails";

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
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.LEAD_FROM_EMAIL;
  const to = process.env.LEAD_TO_EMAIL;

  if (!apiKey || !from || !to) {
    console.warn("[email] RESEND_API_KEY / LEAD_FROM_EMAIL / LEAD_TO_EMAIL not set — skipping send");
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
    const response = await fetch(API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        // Hitting reply in the inbox writes back to the lead, not to yourself.
        reply_to: lead.email,
        subject: `New enquiry — ${lead.name} (${lead.service})`,
        text,
        html,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(`[email] Resend returned ${response.status}: ${await response.text()}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[email] send failed:", error);
    return false;
  }
}
