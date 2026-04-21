import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { submitContact } from '../services/api';
import { trackFormSubmit, trackOutboundClick } from '../utils/analytics';
import { FaEnvelope, FaLinkedinIn, FaTwitter, FaMapMarkerAlt, FaWhatsapp, FaCalendarAlt } from 'react-icons/fa';
import './Contact.css';

export default function Contact() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', company: '', subject: '', message: '' });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus(null);
    try {
      await submitContact(form);
      trackFormSubmit('contact_form');
      navigate('/thank-you?source=contact');
    } catch {
      setStatus('error');
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title="Contact | Free SEO Consultation NYC"
        description="Get in touch with Kastriot Tanaj for a free SEO consultation. Book a call, WhatsApp, or email — serving businesses in New York City and worldwide."
        canonical="/contact"
      />

      <section className="page-hero">
        <div className="container">
          <h1>Contact Kastriot Tanaj — Free SEO Consultation</h1>
          <p>Ready to dominate Google? Let's talk about your SEO goals.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <h2>Let's Work Together</h2>
              <p>
                Whether you need a full SEO strategy, a quick audit, or just want to chat
                about how to improve your rankings in New York — I'm here to help.
              </p>

              <div className="contact-info__items">
                <div className="contact-info__item">
                  <FaMapMarkerAlt />
                  <div>
                    <strong>Location</strong>
                    <span>Serving New York, NY & worldwide remotely</span>
                  </div>
                </div>
                <div className="contact-info__item">
                  <FaEnvelope />
                  <div>
                    <strong>Email</strong>
                    <span>kastriot@kastriottanaj.com</span>
                  </div>
                </div>
                <div className="contact-info__item">
                  <FaLinkedinIn />
                  <div>
                    <strong>LinkedIn</strong>
                    <a href="https://www.linkedin.com/in/seo-kastriot-tanaj/" target="_blank" rel="noopener noreferrer">linkedin.com/in/kastriottanaj</a>
                  </div>
                </div>
                <div className="contact-info__item">
                  <FaTwitter />
                  <div>
                    <strong>Twitter</strong>
                    <a href="https://twitter.com/kastriottanaj" target="_blank" rel="noopener noreferrer">@kastriottanaj</a>
                  </div>
                </div>
                <div className="contact-info__item">
                  <FaWhatsapp />
                  <div>
                    <strong>WhatsApp</strong>
                    <a href="https://api.whatsapp.com/send/?phone=38348111611&text&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" onClick={() => trackOutboundClick('whatsapp', 'contact_page')}>Message me on WhatsApp</a>
                  </div>
                </div>
                <div className="contact-info__item">
                  <FaCalendarAlt />
                  <div>
                    <strong>Book a Meeting</strong>
                    <a href="https://calendly.com/kastriot-sym/30min" target="_blank" rel="noopener noreferrer" onClick={() => trackOutboundClick('calendly', 'contact_page')}>Schedule a free 30-min call</a>
                  </div>
                </div>
              </div>
            </div>

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-form__row">
                <div className="contact-form__group">
                  <label htmlFor="name">Name *</label>
                  <input type="text" id="name" name="name" value={form.name} onChange={handleChange} required />
                </div>
                <div className="contact-form__group">
                  <label htmlFor="email">Email *</label>
                  <input type="email" id="email" name="email" value={form.email} onChange={handleChange} required />
                </div>
              </div>
              <div className="contact-form__row">
                <div className="contact-form__group">
                  <label htmlFor="company">Company</label>
                  <input type="text" id="company" name="company" value={form.company} onChange={handleChange} />
                </div>
                <div className="contact-form__group">
                  <label htmlFor="subject">Subject *</label>
                  <input type="text" id="subject" name="subject" value={form.subject} onChange={handleChange} required />
                </div>
              </div>
              <div className="contact-form__group">
                <label htmlFor="message">Message *</label>
                <textarea id="message" name="message" rows="5" value={form.message} onChange={handleChange} required />
              </div>

              {status === 'error' && (
                <div className="contact-form__status contact-form__status--error">
                  Something went wrong. Please try again or email me directly.
                </div>
              )}

              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
