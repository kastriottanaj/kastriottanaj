import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SEO, { LocalBusinessSchema, PersonSchema } from '../components/SEO';
import { getTestimonials } from '../services/api';
import LeadCapture from '../components/LeadCapture';
import {
  FaArrowRight, FaSearch, FaRobot, FaCogs,
  FaStar, FaCheckCircle, FaTimesCircle, FaChartLine, FaBolt,
  FaShieldAlt, FaExclamationTriangle, FaClock, FaUserTie,
  FaTrophy, FaGlobeAmericas
} from 'react-icons/fa';
import './Home.css';

export default function Home() {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    getTestimonials({ featured: true }).then(res => setTestimonials(res.data)).catch(() => {});
  }, []);

  return (
    <>
      <SEO
        title="NYC's #1 SEO Consultant | Get More Customers From Google"
        description="Kastriot Tanaj helps NYC businesses dominate Google with AI-powered SEO strategies. Get your FREE SEO audit and discover hidden revenue in your search rankings."
        canonical="/"
      />
      <LocalBusinessSchema />
      <PersonSchema />

      {/* ===== HERO: 4 seconds — Enthusiastic, Sharp, Authority ===== */}
      <section className="hero">
        <div className="hero__overlay" />
        <div className="hero__container">
          <div className="hero__content">
            <div className="hero__badge">
              <FaTrophy /> NYC's Trusted SEO Consultant
            </div>
            <h1 className="hero__title">
              Your NYC Competitors Are <span>Stealing Your Customers</span> on Google Right Now
            </h1>
            <p className="hero__subtitle">
              Every day you're not on page 1, your competitors are getting the calls, the leads,
              and the revenue that should be yours. I fix that — with data-driven SEO strategies
              and AI-powered automation that deliver real, measurable results.
            </p>

            {/* Lead Capture — The Opt-in Bribe */}
            <div className="hero__lead-capture">
              <LeadCapture
                variant="hero"
                headline="Get Your FREE SEO Audit ($500 Value)"
                subtext="See exactly why your competitors outrank you — and how to fix it in 30 days."
              />
            </div>

            {/* Authority Stats */}
            <div className="hero__stats">
              <div className="hero__stat">
                <strong>4+</strong>
                <span>Years in SEO</span>
              </div>
              <div className="hero__stat">
                <strong>Page 1</strong>
                <span>Rankings Delivered</span>
              </div>
              <div className="hero__stat">
                <strong>5+</strong>
                <span>Businesses Helped</span>
              </div>
              <div className="hero__stat">
                <strong>3</strong>
                <span>Countries Served</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PAIN AMPLIFICATION: What you're losing ===== */}
      <section className="pain-section">
        <div className="container">
          <div className="section__header">
            <span className="section__eyebrow"><FaExclamationTriangle /> The Hard Truth</span>
            <h2>Here's What Happens When You're <span className="text-danger">Invisible</span> on Google</h2>
            <p>If your business isn't on page 1, you're losing money every single day</p>
          </div>
          <div className="pain-grid">
            <div className="pain-card">
              <div className="pain-card__icon"><FaTimesCircle /></div>
              <h3>75% of Users Never Scroll Past Page 1</h3>
              <p>If you're on page 2 or beyond, you're invisible. Your competitors are capturing the customers that are actively searching for your services right now in New York.</p>
            </div>
            <div className="pain-card">
              <div className="pain-card__icon"><FaClock /></div>
              <h3>Every Month You Wait Costs You $10K+</h3>
              <p>While you're "thinking about it," your competitors are building domain authority, ranking for your keywords, and locking in customers that should be yours.</p>
            </div>
            <div className="pain-card">
              <div className="pain-card__icon"><FaTimesCircle /></div>
              <h3>Bad SEO Is Worse Than No SEO</h3>
              <p>Outdated tactics, keyword stuffing, or ignoring technical issues can get you penalized by Google. Once penalized, recovery takes months — and costs a fortune.</p>
            </div>
          </div>
          <div className="pain-section__cta">
            <p className="pain-section__question">Does any of this sound familiar?</p>
            <Link to="/contact" className="btn btn--danger">
              Stop Losing Customers — Get Your Free Audit <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== TEN #1: Love the Product/Service ===== */}
      <section className="section">
        <div className="container">
          <div className="section__header">
            <span className="section__eyebrow"><FaBolt /> What Makes This Different</span>
            <h2>Not Another "SEO Agency" — This Is a <span className="text-gradient">Revenue Machine</span></h2>
            <p>Most SEO consultants give you rankings. I give you revenue.</p>
          </div>
          <div className="services-grid">
            <div className="service-card service-card--featured">
              <div className="service-card__icon"><FaSearch /></div>
              <h3>SEO Strategy That Prints Money</h3>
              <p>I don't just chase rankings — I target the keywords that actually bring paying customers. Every strategy is built on revenue data, not vanity metrics.</p>
              <ul className="service-card__benefits">
                <li><FaCheckCircle /> Competitor gap analysis</li>
                <li><FaCheckCircle /> Revenue-focused keyword targeting</li>
                <li><FaCheckCircle /> Custom 90-day action plan</li>
              </ul>
            </div>
            <div className="service-card service-card--featured">
              <div className="service-card__icon"><FaRobot /></div>
              <h3>AI-Powered Content at Scale</h3>
              <p>I use cutting-edge AI tools to produce high-ranking content 10x faster than traditional agencies — without sacrificing quality. Your competitors can't keep up.</p>
              <ul className="service-card__benefits">
                <li><FaCheckCircle /> AI content generation pipelines</li>
                <li><FaCheckCircle /> Topical authority building</li>
                <li><FaCheckCircle /> Content that converts visitors to buyers</li>
              </ul>
            </div>
            <div className="service-card service-card--featured">
              <div className="service-card__icon"><FaCogs /></div>
              <h3>Automation That Saves You 20+ Hours/Week</h3>
              <p>Automated rank tracking, reporting, and lead nurturing workflows that run on autopilot — so you can focus on closing deals instead of staring at dashboards.</p>
              <ul className="service-card__benefits">
                <li><FaCheckCircle /> Hands-free reporting</li>
                <li><FaCheckCircle /> Lead nurture automation</li>
                <li><FaCheckCircle /> Real-time rank monitoring</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMPARISON TABLE: You vs. DIY vs. Agency ===== */}
      <section className="section section--dark">
        <div className="container">
          <div className="section__header section__header--light">
            <h2>Why Smart NYC Business Owners Choose Me Over Agencies</h2>
            <p>See the difference for yourself</p>
          </div>
          <div className="comparison-table">
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th className="comparison-table__highlight">Working With Me</th>
                  <th>Typical NYC Agency</th>
                  <th>DIY / Freelancer</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Monthly Cost</td>
                  <td className="comparison-table__highlight">$$</td>
                  <td>$$$$</td>
                  <td>$</td>
                </tr>
                <tr>
                  <td>Personalized Strategy</td>
                  <td className="comparison-table__highlight"><FaCheckCircle className="text-green" /></td>
                  <td><FaTimesCircle className="text-muted" /></td>
                  <td><FaTimesCircle className="text-muted" /></td>
                </tr>
                <tr>
                  <td>AI-Powered Tools</td>
                  <td className="comparison-table__highlight"><FaCheckCircle className="text-green" /></td>
                  <td><FaCheckCircle className="text-green" /></td>
                  <td><FaTimesCircle className="text-muted" /></td>
                </tr>
                <tr>
                  <td>Direct Access to Expert</td>
                  <td className="comparison-table__highlight"><FaCheckCircle className="text-green" /></td>
                  <td><FaTimesCircle className="text-muted" /></td>
                  <td><FaTimesCircle className="text-muted" /></td>
                </tr>
                <tr>
                  <td>NYC Market Expertise</td>
                  <td className="comparison-table__highlight"><FaCheckCircle className="text-green" /></td>
                  <td>Maybe</td>
                  <td><FaTimesCircle className="text-muted" /></td>
                </tr>
                <tr>
                  <td>Revenue-Focused Results</td>
                  <td className="comparison-table__highlight"><FaCheckCircle className="text-green" /></td>
                  <td><FaTimesCircle className="text-muted" /></td>
                  <td><FaTimesCircle className="text-muted" /></td>
                </tr>
                <tr>
                  <td>Transparent Reporting</td>
                  <td className="comparison-table__highlight"><FaCheckCircle className="text-green" /></td>
                  <td>Sometimes</td>
                  <td><FaTimesCircle className="text-muted" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== TEN #2: Trust and Love YOU ===== */}
      <section className="section">
        <div className="container">
          <div className="authority-section">
            <div className="authority-section__content">
              <span className="section__eyebrow"><FaUserTie /> Meet Your SEO Partner</span>
              <h2>I'm Kastriot Tanaj — And I'm Obsessed With Getting You Results</h2>
              <p>
                I'm not another faceless agency. I'm a real person who picks up the phone, answers
                your emails, and genuinely cares about your rankings — because your success is my success.
              </p>
              <p>
                With 4+ years of hands-on SEO experience, I've helped businesses across Switzerland,
                Germany, the Netherlands, and Kosovo rank on Google's first page. From a Swiss company
                to a boutique hotel in Amsterdam, I combine deep SEO expertise with AI-powered tools
                to deliver results that traditional agencies can't match.
              </p>
              <div className="authority-section__credentials">
                <div className="credential">
                  <FaShieldAlt />
                  <span>4+ Years SEO Experience</span>
                </div>
                <div className="credential">
                  <FaGlobeAmericas />
                  <span>Clients in 3+ Countries</span>
                </div>
                <div className="credential">
                  <FaChartLine />
                  <span>Google & SEMrush Certified</span>
                </div>
                <div className="credential">
                  <FaTrophy />
                  <span>Page 1 Rankings Delivered</span>
                </div>
              </div>
              <Link to="/about" className="btn btn--primary">
                Learn More About Me <FaArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOCIAL PROOF / TESTIMONIALS ===== */}
      <section className="section section--alt">
        <div className="container">
          <div className="section__header">
            <span className="section__eyebrow"><FaStar /> Client Results</span>
            <h2>Don't Take My Word For It — Here's What My Clients Say</h2>
          </div>
          <div className="testimonials-grid">
            {(testimonials.length > 0 ? testimonials : [
              { id: 1, name: 'STS Company', role: 'SEO Strategy', company: 'Switzerland', rating: 5, content: 'Implemented a full SEO strategy and managed to rank the company on the first page of Google for important industry keywords.' },
              { id: 2, name: 'Faralda Crane Hotel', role: 'Local SEO', company: 'Amsterdam', rating: 5, content: 'Optimized Google Business Profile and implemented Local SEO strategy to increase visibility and help more guests discover and book the hotel.' },
              { id: 3, name: 'Gardening Company', role: 'Website & SEO', company: 'Cologne, Germany', rating: 5, content: 'Built the website with WordPress and implemented an SEO strategy to rank higher for important local keywords in the German market.' },
            ]).map(t => (
              <div key={t.id} className="testimonial-card testimonial-card--premium">
                <div className="testimonial-card__stars">
                  {[...Array(t.rating)].map((_, i) => <FaStar key={i} />)}
                </div>
                <p>"{t.content}"</p>
                <div className="testimonial-card__author">
                  <div className="testimonial-card__avatar">
                    {t.name.charAt(0)}
                  </div>
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

      {/* ===== PROCESS: How It Works (Straight Line) ===== */}
      <section className="section">
        <div className="container">
          <div className="section__header">
            <span className="section__eyebrow">Simple 3-Step Process</span>
            <h2>From Invisible to Unstoppable in 3 Steps</h2>
            <p>No jargon. No long contracts. Just results.</p>
          </div>
          <div className="process-grid process-grid--three">
            <div className="process-card process-card--numbered">
              <div className="process-card__number">1</div>
              <h3>Free SEO Audit</h3>
              <p>I'll analyze your website, your competitors, and your market — then show you exactly where you're losing money and how to fix it. <strong>No cost, no obligation.</strong></p>
            </div>
            <div className="process-card process-card--numbered">
              <div className="process-card__number">2</div>
              <h3>Custom Strategy</h3>
              <p>Based on the audit, I'll build you a personalized 90-day SEO roadmap targeting the keywords that bring in actual paying customers — not vanity traffic.</p>
            </div>
            <div className="process-card process-card--numbered">
              <div className="process-card__number">3</div>
              <h3>Watch Revenue Grow</h3>
              <p>I execute. You see results. Transparent monthly reporting shows exactly how much traffic, leads, and revenue your SEO investment is generating.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FUTURE PACING: Paint the picture ===== */}
      <section className="future-pace-section">
        <div className="container">
          <div className="future-pace__content">
            <h2>Imagine This: 90 Days From Now...</h2>
            <div className="future-pace__grid">
              <div className="future-pace__item">
                <FaCheckCircle />
                <p>Your phone is ringing with <strong>new leads every week</strong> — people who found you on Google and are ready to buy.</p>
              </div>
              <div className="future-pace__item">
                <FaCheckCircle />
                <p>You're on <strong>page 1 for your most valuable keywords</strong> — right above your competitors.</p>
              </div>
              <div className="future-pace__item">
                <FaCheckCircle />
                <p>Your <strong>Google Ads spend is dropping</strong> because organic traffic is doing the heavy lifting.</p>
              </div>
              <div className="future-pace__item">
                <FaCheckCircle />
                <p>Your competitors are wondering <strong>how you blew past them</strong> seemingly overnight.</p>
              </div>
              <div className="future-pace__item">
                <FaCheckCircle />
                <p>You feel <strong>in control of your business growth</strong> because you finally have a predictable customer acquisition channel.</p>
              </div>
            </div>
            <p className="future-pace__closing">
              This isn't a fantasy. This is exactly what happens when you have the right SEO strategy
              executed by someone who actually knows what they're doing.
            </p>
          </div>
        </div>
      </section>

      {/* ===== RISK REVERSAL / GUARANTEE ===== */}
      <section className="section">
        <div className="container">
          <div className="guarantee-section">
            <div className="guarantee-section__icon"><FaShieldAlt /></div>
            <h2>My Commitment to Transparency</h2>
            <p>
              I believe in honest, clear communication from day one.
              <strong> You'll always know exactly what I'm doing, why I'm doing it,
              and what results to expect.</strong> No hidden fees, no vague reports,
              no empty promises.
            </p>
            <p className="guarantee-section__subtext">
              I only take on clients I know I can help. If your business isn't a good fit,
              I'll tell you upfront — and I might even refer you to someone who's better suited.
              That's how much I value trust.
            </p>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA: Close the sale ===== */}
      <section className="final-cta-section">
        <div className="container">
          <h2>Your Competitors Won't Wait. <span>Will You?</span></h2>
          <p>
            Every day you delay is another day your competitors get stronger on Google.
            The free audit takes 2 minutes to request and could be worth thousands in new revenue.
          </p>
          <LeadCapture
            variant="cta"
            headline="Claim Your Free SEO Audit Now"
            subtext="Limited to 5 new clients per month — spots fill fast."
          />
          <div className="final-cta__trust">
            <span><FaShieldAlt /> 100% Free</span>
            <span><FaCheckCircle /> No Obligation</span>
            <span><FaClock /> Takes 2 Minutes</span>
          </div>
        </div>
      </section>
    </>
  );
}
