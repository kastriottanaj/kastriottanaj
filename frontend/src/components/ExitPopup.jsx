import { useState, useEffect } from 'react';
import { FaTimes, FaGift } from 'react-icons/fa';
import LeadCapture from './LeadCapture';
import './ExitPopup.css';

export default function ExitPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('exitPopupDismissed');
    if (dismissed) return;

    const handleMouseLeave = (e) => {
      if (e.clientY <= 0) {
        setShow(true);
        document.removeEventListener('mouseout', handleMouseLeave);
      }
    };

    // Delay before attaching — don't trigger on initial load
    const timer = setTimeout(() => {
      document.addEventListener('mouseout', handleMouseLeave);
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseout', handleMouseLeave);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem('exitPopupDismissed', 'true');
  };

  if (!show) return null;

  return (
    <div className="exit-popup__overlay" onClick={dismiss}>
      <div className="exit-popup" onClick={(e) => e.stopPropagation()}>
        <button className="exit-popup__close" onClick={dismiss} aria-label="Close">
          <FaTimes />
        </button>
        <div className="exit-popup__icon"><FaGift /></div>
        <h2>Wait — Don't Leave Empty-Handed</h2>
        <p>
          Get a <strong>free, personalized SEO audit</strong> of your website before you go.
          See exactly what's holding you back from page 1.
        </p>
        <LeadCapture
          variant="cta"
          headline=""
          subtext=""
        />
      </div>
    </div>
  );
}
