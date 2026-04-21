import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaCalendarAlt, FaWhatsapp, FaArrowRight } from 'react-icons/fa';
import SEO from '../components/SEO';
import { trackThankYouView, trackOutboundClick } from '../utils/analytics';
import './ThankYou.css';

const CALENDLY_URL = 'https://calendly.com/kastriot-sym/30min';
const WHATSAPP_URL = 'https://api.whatsapp.com/send/?phone=38348111611&text&type=phone_number&app_absent=0';

export default function ThankYou() {
  const [params] = useSearchParams();
  const source = params.get('source') || 'unknown';

  useEffect(() => {
    trackThankYouView(source);
  }, [source]);

  return (
    <>
      <SEO
        title="Thank You — Your Request Is In"
        description="Your free SEO audit request has been received. Kastriot will review your site and reply within 24 hours."
        canonical="/thank-you"
        noindex
      />

      <section className="thankyou">
        <div className="container">
          <div className="thankyou__card">
            <div className="thankyou__icon"><FaCheckCircle /></div>
            <h1>You're In. Check Your Inbox.</h1>
            <p className="thankyou__lede">
              Your request just landed on my desk. I personally review every one —
              expect a reply within <strong>24 hours</strong>, often much sooner.
            </p>

            <div className="thankyou__next">
              <h2>Want to skip the wait?</h2>
              <p>
                Book a free 30-minute call now and we'll dig into your site, your
                competitors, and the fastest path to page 1 — together.
              </p>
              <div className="thankyou__ctas">
                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary"
                  onClick={() => trackOutboundClick('calendly', 'thankyou_primary')}
                >
                  <FaCalendarAlt /> Book My Free Call <FaArrowRight />
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--secondary"
                  onClick={() => trackOutboundClick('whatsapp', 'thankyou_secondary')}
                >
                  <FaWhatsapp /> Message on WhatsApp
                </a>
              </div>
            </div>

            <div className="thankyou__meanwhile">
              <h3>While you wait, read the goods:</h3>
              <ul>
                <li><Link to="/portfolio">Client case studies & ranking results</Link></li>
                <li><Link to="/services">What SEO + AI automation can do for your business</Link></li>
                <li><Link to="/blog">Latest SEO tips and AI workflows</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
