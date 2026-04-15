import { Link } from 'react-router-dom';
import { FaLinkedinIn, FaTwitter, FaGithub, FaEnvelope } from 'react-icons/fa';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              Kastriot<span>Tanaj</span>
            </Link>
            <p>SEO Consultant & AI Automation Expert helping businesses in New York and beyond rank #1 on Google.</p>
            <div className="footer__socials">
              <a href="https://linkedin.com/in/kastriottanaj" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><FaLinkedinIn /></a>
              <a href="https://twitter.com/kastriottanaj" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><FaTwitter /></a>
              <a href="https://github.com/kastriottanaj" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><FaGithub /></a>
              <a href="mailto:kastriot@kastriottanaj.com" aria-label="Email"><FaEnvelope /></a>
            </div>
          </div>

          <div className="footer__links">
            <h4>Quick Links</h4>
            <Link to="/about">About</Link>
            <Link to="/services">Services</Link>
            <Link to="/portfolio">Portfolio</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>

          <div className="footer__links">
            <h4>Services</h4>
            <Link to="/services">SEO Strategy & Consulting</Link>
            <Link to="/services">AI-Powered Content Systems</Link>
            <Link to="/services">Automation Workflows</Link>
            <Link to="/services">1-on-1 SEO Coaching</Link>
          </div>

          <div className="footer__links">
            <h4>Location</h4>
            <p>Serving businesses in</p>
            <p><strong>New York, NY</strong></p>
            <p>& worldwide remotely</p>
          </div>
        </div>

        <div className="footer__bottom">
          <p>&copy; {year} Kastriot Tanaj. All rights reserved.</p>
          <div className="footer__legal">
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
