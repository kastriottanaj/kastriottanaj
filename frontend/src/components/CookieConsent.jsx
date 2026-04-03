import { useState, useEffect } from 'react';
import { FaCookieBite, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import './CookieConsent.css';

const COOKIE_KEY = 'cookie_consent';

const DEFAULT_PREFERENCES = {
  necessary: true,
  analytics: false,
  marketing: false,
};

function getStoredConsent() {
  try {
    const stored = localStorage.getItem(COOKIE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function loadAnalytics() {
  // Google Analytics — replace GA_MEASUREMENT_ID with your real ID
  const gaId = import.meta.env.VITE_GA_ID;
  if (!gaId || document.querySelector(`script[src*="gtag"]`)) return;

  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', gaId);
}

function loadMarketing() {
  // Meta Pixel — replace PIXEL_ID with your real ID
  const pixelId = import.meta.env.VITE_META_PIXEL_ID;
  if (!pixelId || window.fbq) return;

  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0';
    n.queue = [];
    t = b.createElement(e); t.async = true; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

function applyConsent(prefs) {
  if (prefs.analytics) loadAnalytics();
  if (prefs.marketing) loadMarketing();
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState(DEFAULT_PREFERENCES);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      applyConsent(stored);
    } else {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveAndClose = (preferences) => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify(preferences));
    applyConsent(preferences);
    setVisible(false);
  };

  const acceptAll = () => {
    saveAndClose({ necessary: true, analytics: true, marketing: true });
  };

  const acceptSelected = () => {
    saveAndClose({ ...prefs, necessary: true });
  };

  const denyAll = () => {
    saveAndClose({ necessary: true, analytics: false, marketing: false });
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-banner__content">
        <div className="cookie-banner__header">
          <FaCookieBite className="cookie-banner__icon" />
          <div>
            <h3>We Value Your Privacy</h3>
            <p>
              We use cookies to improve your experience, analyze traffic, and serve
              targeted ads. You can choose which cookies to allow.
            </p>
          </div>
        </div>

        {showDetails && (
          <div className="cookie-banner__details">
            <label className="cookie-option">
              <div>
                <strong>Necessary</strong>
                <span>Required for the website to function. Cannot be disabled.</span>
              </div>
              <input type="checkbox" checked disabled />
            </label>
            <label className="cookie-option">
              <div>
                <strong>Analytics</strong>
                <span>Help us understand how visitors use the site (Google Analytics).</span>
              </div>
              <input
                type="checkbox"
                checked={prefs.analytics}
                onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
              />
            </label>
            <label className="cookie-option">
              <div>
                <strong>Marketing</strong>
                <span>Used for retargeting and personalized ads (Meta Pixel).</span>
              </div>
              <input
                type="checkbox"
                checked={prefs.marketing}
                onChange={(e) => setPrefs({ ...prefs, marketing: e.target.checked })}
              />
            </label>
          </div>
        )}

        <div className="cookie-banner__actions">
          <button
            className="cookie-banner__toggle"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <><FaChevronUp /> Hide Details</> : <><FaChevronDown /> Customize</>}
          </button>
          <div className="cookie-banner__buttons">
            <button className="cookie-btn cookie-btn--deny" onClick={denyAll}>
              Deny All
            </button>
            {showDetails && (
              <button className="cookie-btn cookie-btn--selected" onClick={acceptSelected}>
                Accept Selected
              </button>
            )}
            <button className="cookie-btn cookie-btn--accept" onClick={acceptAll}>
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
