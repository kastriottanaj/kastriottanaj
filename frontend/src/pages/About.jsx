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
  { year: '2021', title: 'Started in SEO at a Swiss Company', desc: 'Joined as an intern and quickly became the go-to person for SEO. Within two years, mastered the craft and started delivering real rankings.' },
  { year: '2022', title: 'First Page 1 Rankings', desc: 'Implemented SEO strategy for the STS company in Switzerland — ranked them on page 1 for their most important keywords.' },
  { year: '2023', title: 'Expanded Across Europe', desc: 'Took on clients in Germany, Netherlands, and Kosovo — from AT BAU GmbH in Cologne to the Faralda Crane Hotel in Amsterdam.' },
  { year: '2024', title: 'AI + SEO Fusion', desc: 'Integrated AI-powered tools into SEO workflows, combining marketing expertise with automation to deliver faster, smarter results.' },
  { year: '2025+', title: 'Targeting the NYC Market', desc: 'Bringing battle-tested European SEO expertise to the most competitive market in the world — New York City.' },
];

export default function About() {
  return (
    <>
      <SEO
        title="About Kastriot Tanaj"
        description="Learn about Kastriot Tanaj — an SEO consultant and AI automation expert with 4+ years of experience helping businesses across Europe and New York rank on Google."
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
                and beyond dominate search engine results. With 4+ years of hands-on experience,
                3 SEO agencies, and 100+ clients across multiple countries, I combine data-driven
                strategies with cutting-edge AI tools to deliver measurable results.
              </p>
              <p>
                My mission is simple: turn Google into your best salesperson. I started as an intern
                at a Swiss company, fell in love with SEO, and have been obsessed with rankings
                ever since. After working across agencies in Europe and managing campaigns for
                100+ clients, I now bring that expertise directly to businesses ready to dominate Google.
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
            <h2>Skills & Certifications</h2>
            <p>Google Cloud certified, SEMrush certified, and always learning</p>
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
