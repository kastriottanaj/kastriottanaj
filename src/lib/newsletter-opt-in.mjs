import { markHandedOff, releaseConfirmationAttempt } from "./newsletter-store.mjs";
import { sendConfirmationEmail } from "./newsletter-email.mjs";
import {
  findSubscriber,
  mailerliteConfigured,
  mailerliteOwnsOptIn,
  mailerliteTimestamp,
  upsertSubscriber,
} from "./mailerlite.mjs";

const defaultServices = {
  markHandedOff,
  releaseConfirmationAttempt,
  sendConfirmationEmail,
  findSubscriber,
  mailerliteConfigured,
  mailerliteOwnsOptIn,
  mailerliteTimestamp,
  upsertSubscriber,
};

/**
 * Deliver a reserved confirmation, preserving MailerLite contacts even when
 * they joined elsewhere and have no previous local handoff record.
 *
 * @param {{ email: string, source: string, ip: string | null, confirmToken: string }} input
 * @param {typeof defaultServices} [services]
 * @returns {Promise<boolean>}
 */
export async function sendSubscriptionConfirmation(
  { email, source, ip, confirmToken },
  services = defaultServices
) {
  let delivered = false;

  try {
    if (services.mailerliteConfigured() && services.mailerliteOwnsOptIn()) {
      // A local row cannot tell whether this address already confirmed via
      // another form, an import, or MailerLite itself. Always read before writing.
      const existing = await services.findSubscriber(email);
      if (existing.error === null && existing.status === "active") {
        services.markHandedOff(email);
        delivered = true;
        return true;
      }

      if (existing.error === null && (!existing.found || existing.status !== null)) {
        const pushed = await services.upsertSubscriber({
          email,
          status: "unconfirmed",
          source,
          ip,
          subscribedAt: services.mailerliteTimestamp(),
        });
        if (pushed.ok) {
          services.markHandedOff(email);
          delivered = true;
          return true;
        }
        console.error("[subscribe] MailerLite push failed, sending our own confirmation instead");
      } else {
        // An unavailable or incomplete lookup is not proof of delivery. Leave
        // MailerLite unchanged and require successful SMTP delivery instead.
        console.error("[subscribe] MailerLite lookup failed, sending our own confirmation instead");
      }
    }

    delivered = await services.sendConfirmationEmail({ address: email, token: confirmToken });
    return delivered;
  } catch (error) {
    console.error("[subscribe] confirmation delivery failed:", error);
    return false;
  } finally {
    // The reservation suppresses simultaneous sends while delivery is in flight,
    // but an unsuccessful attempt must allow the visitor to retry immediately.
    if (!delivered) services.releaseConfirmationAttempt(email, confirmToken);
  }
}
