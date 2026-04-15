import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO, { ServiceSchema, FAQSchema } from '../components/SEO';
import { getServices } from '../services/api';
import {
  FaArrowRight, FaSearch, FaRobot, FaCogs, FaChalkboardTeacher,
  FaCheckCircle, FaTimesCircle, FaRegClock, FaTag, FaUserCheck,
} from 'react-icons/fa';
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
    process: [
      { step: 'Discovery & Audit', detail: 'I dig into your site, your analytics, your backlinks, and your top 5 competitors. You get a written audit with every issue ranked by revenue impact — not by a generic checklist.' },
      { step: 'Strategy Build', detail: 'I map the keywords that actually drive revenue in your niche (not the high-volume vanity terms) and build a 90-day roadmap prioritized by ROI and difficulty.' },
      { step: 'Execution & Reporting', detail: 'Technical fixes, on-page optimization, and content priorities get shipped in sprints. You see a monthly report tied to rankings, traffic, and pipeline — no fluff dashboards.' },
    ],
    timeline: 'First results in 30–60 days · meaningful ranking movement by 90 days',
    pricing: 'Strategy engagements start at $1,500/mo',
    bestFor: 'NYC B2B and service businesses with a website that ranks below page 1 for their core money keywords.',
  },
  {
    id: 2,
    icon: 'fa-robot',
    title: 'AI-Powered Content Systems',
    description: 'Scalable content pipelines using AI to produce high-ranking, engaging content. From blog posts to landing pages, I build systems that generate traffic-driving content at speed.',
    features: ['AI content generation workflows', 'Content calendar & planning', 'SEO-optimized copywriting', 'Content performance tracking'],
    process: [
      { step: 'Topical Map', detail: 'I cluster your niche into topic pillars and supporting articles — the structure Google rewards with topical authority — before a single word is written.' },
      { step: 'Pipeline Build', detail: 'I set up an AI-assisted production system (briefs → drafts → human editing → publish) so you can ship 4–10x more content per month without losing the voice of a human editor.' },
      { step: 'Measure & Iterate', detail: 'Every piece is tagged and tracked. Winners get updated and expanded; losers get pruned. The system compounds instead of rotting.' },
    ],
    timeline: 'Pipeline live in 2–3 weeks · first ranked articles typically within 60–90 days',
    pricing: 'Content systems start at $2,000/mo',
    bestFor: 'Businesses that want to publish at scale but refuse to ship the generic ChatGPT slop their competitors are pumping out.',
  },
  {
    id: 3,
    icon: 'fa-cogs',
    title: 'Automation Workflows',
    description: 'Save hours every week with automated SEO reporting, rank tracking, and marketing workflows. I build custom automations that keep your SEO machine running on autopilot.',
    features: ['Automated rank tracking', 'Custom reporting dashboards', 'Lead nurture automation', 'Integration with your tools'],
    process: [
      { step: 'Audit Your Workflow', detail: 'We map the manual work eating your team\'s week — reporting, lead routing, rank checks, content approvals — and flag the 3–5 workflows with the best ROI to automate first.' },
      { step: 'Build & Integrate', detail: 'I build custom automations with tools like Make, n8n, and Zapier, hooked into your CRM, GSC, GA4, and whatever else you already pay for. No new software you have to learn.' },
      { step: 'Hand Off & Document', detail: 'Every automation ships with a runbook your team can maintain. You own it — I\'m not holding you hostage to keep it running.' },
    ],
    timeline: 'Most automations live in 1–2 weeks · full workflow overhaul in 4–6 weeks',
    pricing: 'Project-based, starting at $1,200 per workflow',
    bestFor: 'Lean teams and solo founders who are spending 10+ hours a week on work a computer should be doing.',
  },
  {
    id: 4,
    icon: 'fa-chalkboard-teacher',
    title: '1-on-1 SEO Coaching',
    description: 'Personalized coaching for founders, marketers, and in-house teams who want to build SEO expertise. Learn the strategies and tools the pros use.',
    features: ['Custom learning plan', 'Hands-on tool training', 'Strategy review sessions', 'Ongoing Slack/email support'],
    process: [
      { step: 'Skill Assessment', detail: 'We start with a call to figure out what you already know, what you\'re stuck on, and what your business actually needs you to learn — so you\'re not wasting hours on YouTube tutorials.' },
      { step: 'Weekly Working Sessions', detail: 'Live 60-minute sessions where we work on your real site, your real keywords, your real problems. No generic curriculum — your business is the curriculum.' },
      { step: 'Async Support', detail: 'Between sessions you get Slack/email access so you can send screenshots, ask questions, and get unblocked in hours instead of waiting a week.' },
    ],
    timeline: 'Typical engagement: 3 months · most clients reach operational SEO independence by month 2',
    pricing: 'Coaching starts at $800/mo',
    bestFor: 'Founders and in-house marketers who want to own SEO internally rather than staying dependent on an agency forever.',
  },
];

const FAQS = [
  {
    q: 'How long until I see SEO results?',
    a: 'Technical wins and on-page fixes can move rankings within 30–60 days. Meaningful traffic growth from content and authority typically shows up in 3–6 months. Anyone promising page 1 in 30 days is either lying or doing something that will get you penalized later. I optimize for durable results, not short-lived spikes.',
  },
  {
    q: 'Do you work with businesses outside New York City?',
    a: 'Yes. NYC is my primary market focus, but I work with clients across the US and internationally — I\'ve delivered results for businesses in Switzerland, Germany, the Netherlands, and Kosovo. Local SEO projects naturally work best when I understand the market, but strategy, content systems, and automation work remotely anywhere.',
  },
  {
    q: 'What makes your service different from a traditional SEO agency?',
    a: 'Three things. First, you work with me directly — not an account manager who funnels your questions to a junior offshore team. Second, I combine traditional SEO with AI automation, so you get output velocity a 5-person agency can\'t match at a fraction of the cost. Third, I will tell you when SEO isn\'t the right investment for your business — an agency selling a retainer has no incentive to ever say that.',
  },
  {
    q: 'Is AI-generated content different from generic ChatGPT output?',
    a: 'Completely. Generic ChatGPT content ranks briefly, then gets filtered as Google\'s quality systems catch up. What I build is an AI-assisted pipeline: human-defined topical structure, research-backed briefs, AI drafting, then human editing, fact-checking, and voice tuning before anything publishes. The result reads like it was written by a subject-matter expert — because effectively it was.',
  },
  {
    q: 'What\'s included in the free SEO audit?',
    a: 'A written review of your technical health (crawlability, indexation, Core Web Vitals, schema), on-page gaps on your top 10 pages, a competitor comparison showing which keywords they rank for that you don\'t, and a prioritized list of the 5–10 highest-ROI fixes. No sales pitch — you can take the audit and implement it yourself if you want.',
  },
  {
    q: 'Do you require long-term contracts?',
    a: 'No. Engagements are month-to-month after an initial 90-day commitment (needed because SEO simply doesn\'t show results in 30 days). If I\'m not delivering value, you leave. That pressure keeps me focused on outcomes, not on protecting a retainer.',
  },
  {
    q: 'Can you work alongside my existing marketing team or agency?',
    a: 'Yes, and often that\'s the best setup. I can plug in as the SEO specialist while your agency handles paid, creative, or brand. I\'ll document everything so your team is never in the dark, and I\'m happy to run joint calls with other vendors if it helps you get aligned.',
  },
  {
    q: 'What industries do you specialize in?',
    a: 'I\'ve had the strongest results with B2B SaaS, professional services (legal, accounting, consulting), hospitality, and local service businesses. I don\'t take on affiliate or pure e-commerce projects because they require a different playbook than the one I run.',
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
    ? services.map(s => {
        const fallback = FALLBACK_SERVICES.find(f => f.title === s.title) || FALLBACK_SERVICES[0];
        return { ...s, features: [], process: fallback.process, timeline: fallback.timeline, pricing: fallback.pricing, bestFor: fallback.bestFor };
      })
    : FALLBACK_SERVICES;

  return (
    <>
      <SEO
        title="SEO & AI Automation Services NYC | Strategy, Content & Workflows"
        description="Professional SEO and AI automation services in New York: technical audits, AI-powered content, business automation workflows, and 1-on-1 coaching. Custom strategies to rank #1 on Google."
        canonical="/services"
      />
      <ServiceSchema />
      <FAQSchema faqs={FAQS} />

      <section className="page-hero">
        <div className="container">
          <h1>SEO Services in New York City</h1>
          <p>Expert SEO solutions to help your business dominate Google in New York and beyond</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="fit-block">
            <div className="fit-block__col">
              <h2 className="fit-block__title"><FaCheckCircle className="fit-block__icon fit-block__icon--yes" /> Who this is for</h2>
              <ul className="fit-block__list">
                <li>NYC business owners who are tired of watching competitors outrank them</li>
                <li>Founders who want SEO results without hiring a $15k/mo agency</li>
                <li>In-house marketers who need a senior specialist to plug gaps</li>
                <li>Operators who see AI as leverage, not a gimmick</li>
              </ul>
            </div>
            <div className="fit-block__col">
              <h2 className="fit-block__title"><FaTimesCircle className="fit-block__icon fit-block__icon--no" /> Who this isn't for</h2>
              <ul className="fit-block__list">
                <li>Anyone looking for black-hat shortcuts or guaranteed #1 rankings</li>
                <li>Businesses that want to ship generic AI content at scale</li>
                <li>Teams unwilling to invest 90 days before judging results</li>
                <li>Buyers optimizing for lowest price instead of ROI</li>
              </ul>
            </div>
          </div>
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

                  {service.process && (
                    <div className="service-process">
                      <h3 className="service-process__heading">How it works</h3>
                      <ol className="service-process__steps">
                        {service.process.map((p, idx) => (
                          <li key={idx} className="service-process__step">
                            <span className="service-process__num">{idx + 1}</span>
                            <div>
                              <strong>{p.step}</strong>
                              <p>{p.detail}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="service-meta">
                    {service.timeline && (
                      <div className="service-meta__item">
                        <FaRegClock /> <span>{service.timeline}</span>
                      </div>
                    )}
                    {service.pricing && (
                      <div className="service-meta__item">
                        <FaTag /> <span>{service.pricing}</span>
                      </div>
                    )}
                    {service.bestFor && (
                      <div className="service-meta__item">
                        <FaUserCheck /> <span><strong>Best for:</strong> {service.bestFor}</span>
                      </div>
                    )}
                  </div>

                  <Link to="/contact" className="btn btn--primary">
                    Get Started <FaArrowRight />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--alt">
        <div className="container">
          <div className="case-snippet">
            <span className="case-snippet__eyebrow">Recent result</span>
            <blockquote>
              "Implemented a full SEO strategy and managed to rank the company on the first page of Google for important industry keywords."
            </blockquote>
            <cite>STS Company — Switzerland · SEO Strategy engagement</cite>
            <Link to="/portfolio" className="case-snippet__link">
              See more client results <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="faq-block">
            <div className="faq-block__header">
              <h2>Frequently Asked Questions</h2>
              <p>Straight answers to what NYC business owners ask before hiring me.</p>
            </div>
            <div className="faq-list">
              {FAQS.map((item, idx) => (
                <details key={idx} className="faq-item">
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
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
