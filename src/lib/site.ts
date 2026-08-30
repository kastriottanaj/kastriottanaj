/** Single source of truth for site-wide copy, URLs and nav. */

export const SITE = {
  url: "https://kastriottanaj.com",
  name: "Kastriot Tanaj",
  title: "Kastriot Tanaj — SEO, Digital Marketing & AI Automation",
  description:
    "I help businesses across Europe grow visibility, win better leads, and automate repetitive marketing work — SEO, digital marketing, and AI automation.",
  tagline: "SEO and AI automation that bring more traffic and less busywork.",
  jobTitle: "SEO Specialist & AI Automation Builder",
  locality: "Pristina",
  country: "XK",
  countryName: "Kosovo",
  based: "Pristina, Kosovo — working remotely worldwide",
  phone: "+38348111611",
  phoneDisplay: "+383 48 111 611",
  /** Digits only, country code first — the format wa.me expects (+383 48 111 611). */
  whatsapp: "38348111611",
  whatsappGreeting: "Hi Kastriot — I came from kastriottanaj.com and I'd like to talk about a project.",
  whatsappUrl:
    "https://wa.me/38348111611?text=Hi%20Kastriot%20%E2%80%94%20I%20came%20from%20kastriottanaj.com%20and%20I%27d%20like%20to%20talk%20about%20a%20project.",
  linkedin: "https://www.linkedin.com/in/seo-kastriot-tanaj/",
  ogImage: "/assets/ai-seo.webp",
} as const;

/** Meta Pixel / Conversions API dataset. A public identifier: it ships in the
    HTML, and the Conversions API posts server events against the same ID. */
export const META_PIXEL_ID = "1616830733405682";

export const NAV = [
  { href: "/services/", label: "Services" },
  { href: "/bootcamps/", label: "Bootcamps" },
  { href: "/work/", label: "Work" },
  { href: "/process/", label: "Process" },
  { href: "/pricing/", label: "Pricing" },
  { href: "/blog/", label: "Blog" },
  { href: "/newsletter/", label: "Newsletter" },
  { href: "/contact/", label: "Contact" },
] as const;

/** Options in the contact form's service select — also the server's allowlist. */
export const SERVICE_OPTIONS = [
  "SEO",
  "Digital Marketing",
  "AI Automation",
  "Web Development",
  "Not sure yet",
] as const;
