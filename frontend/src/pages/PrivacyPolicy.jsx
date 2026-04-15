import SEO from '../components/SEO';
import './PrivacyPolicy.css';

const LAST_UPDATED = 'April 15, 2026';

export default function PrivacyPolicy() {
  return (
    <>
      <SEO
        title="Privacy Policy | Kastriot Tanaj"
        description="How Kastriot Tanaj collects, uses, and protects your personal information on kastriottanaj.com — including cookies, analytics, and your rights under GDPR and CCPA."
        canonical="/privacy"
      />

      <section className="legal">
        <div className="container">
          <header className="legal__header">
            <h1>Privacy Policy</h1>
            <p className="legal__meta">Last updated: {LAST_UPDATED}</p>
          </header>

          <div className="legal__body">
            <p>
              This Privacy Policy explains how Kastriot Tanaj ("I", "me", "we") collects, uses,
              and protects your personal information when you visit{' '}
              <a href="https://kastriottanaj.com">kastriottanaj.com</a> (the "Site") or contact me
              about SEO consulting or AI automation services. By using the Site, you agree to the
              practices described below.
            </p>

            <h2>1. Who I Am</h2>
            <p>
              Kastriot Tanaj is an independent SEO and AI Automation consultant serving clients
              in New York City and worldwide. For any privacy question or request, contact me at{' '}
              <a href="mailto:kastriot@kastriottanaj.com">kastriot@kastriottanaj.com</a>.
            </p>

            <h2>2. Information I Collect</h2>
            <h3>Information you provide directly</h3>
            <ul>
              <li>
                <strong>Contact form submissions:</strong> name, email address, company (optional),
                subject, and message content.
              </li>
              <li>
                <strong>Email correspondence:</strong> any information you share when emailing me
                directly.
              </li>
            </ul>

            <h3>Information collected automatically</h3>
            <ul>
              <li>
                <strong>Server logs:</strong> IP address, browser type, referring URL, pages visited,
                and timestamps. Collected by the hosting provider for security and diagnostics.
              </li>
              <li>
                <strong>Cookies and similar technologies:</strong> only after you consent through
                the cookie banner. See Section 4.
              </li>
            </ul>

            <h2>3. How I Use Your Information</h2>
            <ul>
              <li>Respond to your inquiries and deliver services you request.</li>
              <li>Send follow-up emails related to your inquiry or proposal.</li>
              <li>Improve Site performance, security, and content.</li>
              <li>Comply with legal obligations.</li>
            </ul>
            <p>
              I do <strong>not</strong> sell, rent, or trade your personal information. I do not use
              your data for automated decision-making or profiling.
            </p>

            <h2>4. Cookies &amp; Tracking</h2>
            <p>
              The Site uses a cookie consent banner that lets you accept or deny non-essential
              cookies. Categories used:
            </p>
            <ul>
              <li>
                <strong>Necessary:</strong> required for core functionality (e.g. remembering your
                cookie choice). Cannot be disabled.
              </li>
              <li>
                <strong>Analytics (Google Analytics):</strong> loaded only if you consent. Helps me
                understand how visitors use the Site. Google may process this data in the United
                States. See{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                  Google's Privacy Policy
                </a>.
              </li>
              <li>
                <strong>Marketing (Meta Pixel):</strong> loaded only if you consent. Used for
                retargeting on Meta platforms. See{' '}
                <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer">
                  Meta's Privacy Policy
                </a>.
              </li>
            </ul>
            <p>
              You can change your preferences at any time by clearing the <code>cookie_consent</code>{' '}
              entry from your browser's local storage or by using your browser's cookie controls.
            </p>

            <h2>5. Third-Party Services</h2>
            <p>
              The Site relies on trusted third parties to operate. Each has its own privacy policy:
            </p>
            <ul>
              <li>
                <strong>Render</strong> (hosting &amp; database) —{' '}
                <a href="https://render.com/privacy" target="_blank" rel="noopener noreferrer">
                  render.com/privacy
                </a>
              </li>
              <li>
                <strong>Google Analytics</strong> (if consented) —{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                  policies.google.com/privacy
                </a>
              </li>
              <li>
                <strong>Meta Pixel</strong> (if consented) —{' '}
                <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer">
                  facebook.com/privacy/policy
                </a>
              </li>
            </ul>

            <h2>6. Data Retention</h2>
            <p>
              Contact form submissions are retained for as long as needed to respond to your
              inquiry and, if we engage in a business relationship, for the duration of that
              engagement plus a reasonable period for legal, tax, and accounting obligations.
              Server logs are typically retained for up to 90 days. You may request earlier
              deletion at any time.
            </p>

            <h2>7. Data Security</h2>
            <p>
              Data is transmitted over HTTPS and stored with reputable providers that maintain
              industry-standard security controls. No method of transmission or storage is 100%
              secure, but I take reasonable steps to protect your information.
            </p>

            <h2>8. Your Rights</h2>
            <p>
              Depending on where you live, you may have the following rights over your personal
              information:
            </p>
            <ul>
              <li>
                <strong>Access &amp; portability</strong> — request a copy of the data I hold about you.
              </li>
              <li>
                <strong>Correction</strong> — ask me to fix inaccurate data.
              </li>
              <li>
                <strong>Deletion</strong> — ask me to delete your data (subject to legal retention).
              </li>
              <li>
                <strong>Withdraw consent</strong> — change cookie preferences or unsubscribe from emails.
              </li>
              <li>
                <strong>Object or restrict</strong> — object to certain processing activities.
              </li>
              <li>
                <strong>Non-discrimination</strong> — I will not treat you differently for exercising
                these rights (CCPA).
              </li>
            </ul>
            <p>
              To exercise any of these rights, email{' '}
              <a href="mailto:kastriot@kastriottanaj.com">kastriot@kastriottanaj.com</a>. EU/UK
              residents have the right to lodge a complaint with their local data protection
              authority.
            </p>

            <h2>9. International Transfers</h2>
            <p>
              The Site is hosted in the United States. If you access it from outside the U.S.,
              your information will be transferred to and processed in the U.S., which may have
              different data protection laws than your country.
            </p>

            <h2>10. Children's Privacy</h2>
            <p>
              The Site is not directed at children under 16, and I do not knowingly collect data
              from them. If you believe a child has submitted information, contact me and I will
              delete it.
            </p>

            <h2>11. Changes to This Policy</h2>
            <p>
              I may update this Privacy Policy from time to time. The "Last updated" date at the
              top reflects the most recent revision. Material changes will be highlighted on the
              Site.
            </p>

            <h2>12. Contact</h2>
            <p>
              Questions or requests about this policy or your data:{' '}
              <a href="mailto:kastriot@kastriottanaj.com">kastriot@kastriottanaj.com</a>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
