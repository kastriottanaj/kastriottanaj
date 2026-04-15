import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { getProjects, getTestimonials } from '../services/api';
import { FaArrowRight, FaStar, FaExternalLinkAlt } from 'react-icons/fa';
import './Portfolio.css';

export default function Portfolio() {
  const [projects, setProjects] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getProjects().then(res => res.data?.results || res.data).catch(() => []),
      getTestimonials().then(res => res.data).catch(() => []),
    ]).then(([p, t]) => {
      setProjects(p);
      setTestimonials(t);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEO
        title="SEO Portfolio & Case Studies | Proven Results"
        description="See real SEO results: page 1 rankings for clients across Europe and New York. Case studies from STS Company, Faralda Crane Hotel, AT BAU GmbH, and more."
        canonical="/portfolio"
      />

      <section className="page-hero">
        <div className="container">
          <h1>SEO Portfolio & Case Studies</h1>
          <p>Real results from real businesses — see how I've helped clients dominate search</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading ? (
            <div className="blog-loading">Loading projects...</div>
          ) : projects.length > 0 ? (
            <div className="portfolio-grid">
              {projects.map(project => (
                <div key={project.id} className="portfolio-card">
                  {project.featured_image && (
                    <div className="portfolio-card__image">
                      <img src={project.featured_image} alt={project.title} loading="lazy" />
                    </div>
                  )}
                  <div className="portfolio-card__content">
                    {project.service && (
                      <span className="portfolio-card__tag">{project.service.title}</span>
                    )}
                    <h2>{project.title}</h2>
                    {project.client && <p className="portfolio-card__client">{project.client}</p>}
                    <p>{project.description}</p>
                    <Link to={`/portfolio/${project.slug}`} className="portfolio-card__link">
                      View Case Study <FaArrowRight />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="blog-empty">
              <h2>Case Studies Coming Soon</h2>
              <p>I'm documenting detailed case studies with measurable results. In the meantime, reach out to discuss how I can help your business.</p>
              <Link to="/contact" className="btn btn--primary" style={{ marginTop: 24 }}>
                Let's Talk <FaArrowRight />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="section section--alt">
          <div className="container">
            <div className="section__header">
              <h2>Client Testimonials</h2>
              <p>What my clients have to say</p>
            </div>
            <div className="testimonials-grid">
              {testimonials.map(t => (
                <div key={t.id} className="testimonial-card">
                  <div className="testimonial-card__stars">
                    {[...Array(t.rating)].map((_, i) => <FaStar key={i} />)}
                  </div>
                  <p>"{t.content}"</p>
                  <div className="testimonial-card__author">
                    {t.avatar && <img src={t.avatar} alt={t.name} loading="lazy" />}
                    <div>
                      <strong>{t.name}</strong>
                      <span>{t.role}{t.company && `, ${t.company}`}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="cta-section">
        <div className="container">
          <h2>Want Results Like These?</h2>
          <p>
            Let's build an SEO strategy that puts your business on top of Google.
            Not sure where to start? See my{' '}
            <Link to="/services" className="text-link-light">SEO &amp; AI automation services</Link>{' '}
            to find the right fit.
          </p>
          <Link to="/contact" className="btn btn--white">
            Start Your Project <FaArrowRight />
          </Link>
        </div>
      </section>
    </>
  );
}
