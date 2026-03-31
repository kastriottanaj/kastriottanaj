import { useState } from 'react';
import { FaArrowRight, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import './LeadCapture.css';

export default function LeadCapture({ variant = 'hero', headline, subtext }) {
  const [form, setForm] = useState({ website: '', email: '' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.website || !form.email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/contact/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          email: form.email,
          subject: 'Free SEO Audit Request',
          message: `Website: ${form.website}`,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className={`lead-capture lead-capture--${variant} lead-capture--success`}>
        <FaCheckCircle className="lead-capture__success-icon" />
        <h3>You're In! Check Your Email</h3>
        <p>I'll personally review your site and send your free audit within 24 hours.</p>
      </div>
    );
  }

  return (
    <div className={`lead-capture lead-capture--${variant}`}>
      {headline && <h3 className="lead-capture__headline">{headline}</h3>}
      {subtext && <p className="lead-capture__subtext">{subtext}</p>}
      <form className="lead-capture__form" onSubmit={handleSubmit}>
        <input
          type="url"
          placeholder="Your website URL"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          required
          className="lead-capture__input"
        />
        <input
          type="email"
          placeholder="Your best email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="lead-capture__input"
        />
        <button
          type="submit"
          className="lead-capture__btn"
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <><FaSpinner className="spin" /> Analyzing...</>
          ) : (
            <>Get My Free Audit <FaArrowRight /></>
          )}
        </button>
      </form>
      {status === 'error' && (
        <p className="lead-capture__error">Something went wrong. Please try again.</p>
      )}
      <p className="lead-capture__privacy">No spam. No BS. Just your free audit.</p>
    </div>
  );
}
