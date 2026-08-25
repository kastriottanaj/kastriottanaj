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
  linkedin: "https://www.linkedin.com/in/seo-kastriot-tanaj/",
  ogImage: "/assets/ai-seo.webp",
} as const;

export const NAV = [
  { href: "/services/", label: "Services" },
  { href: "/bootcamps/", label: "Bootcamps" },
  { href: "/work/", label: "Work" },
  { href: "/#process", label: "Process" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/blog/", label: "Blog" },
  { href: "/newsletter/", label: "Newsletter" },
  { href: "/#contact", label: "Contact" },
] as const;

/** Options in the contact form's service select — also the server's allowlist. */
export const SERVICE_OPTIONS = [
  "SEO",
  "Digital Marketing",
  "AI Automation",
  "Web Development",
  "Not sure yet",
] as const;
