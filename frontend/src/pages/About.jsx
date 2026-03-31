import { Link } from 'react-router-dom';
import SEO, { PersonSchema } from '../components/SEO';
import { FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import './About.css';

const SKILLS = [
  'Technical SEO & Site Audits',
  'AI-Powered Content Strategy',
  'Google Analytics & Search Console',
  'Marketing Automation & Workflows',
  'Keyword Research & Competitor Analysis',
  'Local SEO & Google Business Profile',
  'Link Building & Digital PR',
  'Schema Markup & Structured Data',
];

const TIMELINE = [
  { year: '2021', title: 'Started SEO Journey', desc: 'Began specializing in SEO consulting, working with small businesses to improve their search visibility.' },
  { year: '2022', title: 'Expanded to AI & Automation', desc: 'Integrated AI tools and automation workflows into SEO strategies, delivering faster results at scale.' },
  { year: '2023', title: 'Serving International Clients', desc: 'Grew client base internationally, helping businesses across Europe and the USA rank on Google.' },
  { year: '2024', title: 'Targeting the NYC Market', desc: 'Focused on the New York market, building expertise in local SEO for competitive NYC industries.' },
  { year: '2025+', title: 'Building Authority in New York', desc: 'Establishing presence as a go-to SEO consultant for businesses in New York City.' },
];

export default function About() {
  return (
    <>
      <SEO
        title="About Kastriot Tanaj"
        description="Learn about Kastriot Tanaj — an SEO consultant and AI automation expert with 5+ years of experience helping businesses in New York rank #1 on Google."
        canonical="/about"
      />
      <PersonSchema />

      {/* Hero */}
      <section className="about-hero">
        <div className="container">
          <div className="about-hero__content">
            <div className="about-hero__text">
              <h1>Hi, I'm <span>Kastriot Tanaj</span></h1>
              <p className="about-hero__subtitle">
                I'm an SEO consultant and AI automation expert helping businesses in New York
                and beyond dominate search engine results. With over 5 years of experience,
                I combine data-driven strategies with cutting-edge AI tools to deliver measurable results.
              </p>
              <p>
                My mission is simple: turn Google into your best salesperson. I believe every business
                deserves to be found by the right customers at the right time — and I make that happen.
              </p>
              <Link to="/contact" className="btn btn--primary">
                Let's Work Together <FaArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="section section--alt">
        <div className="container">
          <div className="section__header">
            <h2>Skills & Expertise</h2>
            <p>What I bring to the table</p>
          </div>
          <div className="skills-grid">
            {SKILLS.map(skill => (
              <div key={skill} className="skill-item">
                <FaCheckCircle className="skill-item__icon" />
                <span>{skill}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section">
        <div className="container">
          <div className="section__header">
            <h2>My Journey</h2>
            <p>From SEO beginner to New York consultant</p>
          </div>
          <div className="timeline">
            {TIMELINE.map(item => (
              <div key={item.year} className="timeline__item">
                <div className="timeline__marker">
                  <span>{item.year}</span>
                </div>
                <div className="timeline__content">
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <h2>Want to Work Together?</h2>
          <p>Let's discuss how I can help your business rank #1 in New York.</p>
          <Link to="/contact" className="btn btn--white">
            Get in Touch <FaArrowRight />
          </Link>
        </div>
      </section>
    </>
  );
}
