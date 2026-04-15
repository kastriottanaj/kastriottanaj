import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const SITE = {
  name: 'Kastriot Tanaj',
  domain: 'kastriottanaj.com',
  url: 'https://kastriottanaj.com',
  description: 'New York SEO consultant helping NYC businesses rank #1 on Google. Get a FREE SEO audit and AI-powered strategies that drive revenue.',
  image: 'https://kastriottanaj.com/og-image.jpg',
};

export default function SEO({
  title,
  description,
  canonical,
  type = 'website',
  image,
  article,
  noindex = false,
}) {
  const pageTitle = title || `${SITE.name} | SEO Consultant New York — AI-Powered SEO Services NYC`;
  const pageDescription = description || SITE.description;
  const pageImage = image || SITE.image;
  const pageUrl = canonical ? `${SITE.url}${canonical}` : SITE.url;

  useEffect(() => {
    let el = document.getElementById('canonical-tag');
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', 'canonical');
      el.setAttribute('id', 'canonical-tag');
      document.head.appendChild(el);
    }
    el.setAttribute('href', pageUrl);
  }, [pageUrl]);

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <meta name="twitter:image" content={pageImage} />

      {/* Article-specific */}
      {article && <meta property="article:published_time" content={article.publishedAt} />}
      {article && <meta property="article:modified_time" content={article.updatedAt} />}

      {/* Geo targeting for NYC */}
      <meta name="geo.region" content="US-NY" />
      <meta name="geo.placename" content="New York" />
    </Helmet>
  );
}

export function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Kastriot Tanaj — SEO Consultant',
    description: SITE.description,
    url: SITE.url,
    image: SITE.image,
    telephone: '',
    email: 'kastriot@kastriottanaj.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'New York',
      addressRegion: 'NY',
      addressCountry: 'US',
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'New York',
        sameAs: 'https://en.wikipedia.org/wiki/New_York_City',
      },
      {
        '@type': 'State',
        name: 'New York',
      },
      {
        '@type': 'Country',
        name: 'United States',
      },
    ],
    priceRange: '$$',
    serviceType: ['SEO Consulting', 'AI SEO Automation', 'Content Strategy', 'Technical SEO'],
    knowsAbout: ['Search Engine Optimization', 'AI Content Systems', 'Marketing Automation', 'Google Analytics'],
    sameAs: [
      'https://www.linkedin.com/in/kastriottanaj',
      'https://twitter.com/kastriottanaj',
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function PersonSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Kastriot Tanaj',
    jobTitle: 'SEO Consultant & AI Automation Expert',
    url: SITE.url,
    image: SITE.image,
    description: 'SEO consultant specializing in AI-powered SEO strategies for businesses in New York.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'New York',
      addressRegion: 'NY',
      addressCountry: 'US',
    },
    knowsAbout: ['SEO', 'AI Automation', 'Content Strategy', 'Technical SEO', 'Google Analytics'],
    sameAs: [
      'https://www.linkedin.com/in/kastriottanaj',
      'https://twitter.com/kastriottanaj',
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function ServiceSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'SEO Consulting',
    provider: {
      '@type': 'ProfessionalService',
      name: 'Kastriot Tanaj — SEO Consultant',
      url: SITE.url,
    },
    areaServed: {
      '@type': 'City',
      name: 'New York',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'SEO Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'SEO Strategy & Consulting' },
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'AI-Powered Content Systems' },
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'SEO Automation Workflows' },
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: '1-on-1 SEO Coaching' },
        },
      ],
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function FAQSchema({ faqs }) {
  if (!faqs || faqs.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export function ArticleSchema({ title, description, url, image, publishedAt, updatedAt }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image,
    url: `${SITE.url}${url}`,
    datePublished: publishedAt,
    dateModified: updatedAt,
    author: {
      '@type': 'Person',
      name: 'Kastriot Tanaj',
      url: SITE.url,
    },
    publisher: {
      '@type': 'Person',
      name: 'Kastriot Tanaj',
      url: SITE.url,
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
