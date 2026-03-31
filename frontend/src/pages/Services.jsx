import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { getServices } from '../services/api';
import { FaArrowRight, FaSearch, FaRobot, FaCogs, FaChalkboardTeacher } from 'react-icons/fa';
import './Services.css';

const ICONS = {
  'fa-search': <FaSearch />,
  'fa-robot': <FaRobot />,
  'fa-cogs': <FaCogs />,
  'fa-chalkboard-teacher': <FaChalkboardTeacher />,
};

const FALLBACK_SERVICES = [
  {
    id: 1,
    icon: 'fa-search',
    title: 'SEO Strategy & Consulting',
    description: 'Comprehensive SEO audits, competitive analysis, and custom roadmaps tailored to your business goals. I identify the highest-impact opportunities to get you ranking in New York and beyond.',
    features: ['Full technical SEO audit', 'Competitor gap analysis', 'Custom keyword strategy', 'Monthly reporting & KPIs'],
  },
  {
    id: 2,
    icon: 'fa-robot',
    title: 'AI-Powered Content Systems',
    description: 'Scalable content pipelines using AI to produce high-ranking, engaging content. From blog posts to landing pages, I build systems that generate traffic-driving content at speed.',
    features: ['AI content generation workflows', 'Content calendar & planning', 'SEO-optimized copywriting', 'Content performance tracking'],
  },
  {
    id: 3,
    icon: 'fa-cogs',
    title: 'Automation Workflows',
    description: 'Save hours every week with automated SEO reporting, rank tracking, and marketing workflows. I build custom automations that keep your SEO machine running on autopilot.',
    features: ['Automated rank tracking', 'Custom reporting dashboards', 'Lead nurture automation', 'Integration with your tools'],
  },
  {
    id: 4,
    icon: 'fa-chalkboard-teacher',
    title: '1-on-1 SEO Coaching',
    description: 'Personalized coaching for founders, marketers, and in-house teams who want to build SEO expertise. Learn the strategies and tools the pros use.',
    features: ['Custom learning plan', 'Hands-on tool training', 'Strategy review sessions', 'Ongoing Slack/email support'],
  },
];

export default function Services() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    getServices()
      .then(res => setServices(res.data))
      .catch(() => {});
  }, []);

  const displayServices = services.length > 0
    ? services.map(s => ({ ...s, features: [] }))
    : FALLBACK_SERVICES;

  return (
    <>
      <SEO
        title="SEO Services"
        description="Expert SEO consulting services in New York — strategy, AI content systems, automation workflows, and coaching. Get a custom plan to rank #1 on Google."
        canonical="/services"
      />

      <section className="page-hero">
        <div className="container">
          <h1>SEO Services</h1>
          <p>Expert SEO solutions to help your business dominate Google in New York and beyond</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="services-list">
            {displayServices.map((service, i) => (
              <div key={service.id} className={`service-detail ${i % 2 === 1 ? 'service-detail--reverse' : ''}`}>
                <div className="service-detail__content">
                  <div className="service-detail__icon">
                    {ICONS[service.icon] || <FaSearch />}
                  </div>
                  <h2>{service.title}</h2>
                  <p>{service.description}</p>
                  {service.features?.length > 0 && (
                    <ul className="service-detail__features">
                      {service.features.map(f => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  )}
                  <Link to="/contact" className="btn btn--primary">
                    Get Started <FaArrowRight />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Not Sure Which Service You Need?</h2>
          <p>Book a free consultation and I'll recommend the best approach for your business.</p>
          <Link to="/contact" className="btn btn--white">
            Book Free Consultation <FaArrowRight />
          </Link>
        </div>
      </section>
    </>
  );
}
