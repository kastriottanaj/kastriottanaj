import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { HiMenu, HiX } from 'react-icons/hi';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar__container">
        <Link to="/" className="navbar__logo">
          Kastriot<span>Tanaj</span>
        </Link>

        <nav className={`navbar__nav ${open ? 'navbar__nav--open' : ''}`}>
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `navbar__link ${isActive ? 'navbar__link--active' : ''}`}
              onClick={() => setOpen(false)}
              end={to === '/'}
            >
              {label}
            </NavLink>
          ))}
          <Link to="/contact" className="navbar__cta" onClick={() => setOpen(false)}>
            Get SEO Strategy
          </Link>
        </nav>

        <button className="navbar__toggle" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <HiX size={24} /> : <HiMenu size={24} />}
        </button>
      </div>
    </header>
  );
}
