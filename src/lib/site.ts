/** Single source of truth for site-wide copy, URLs and nav. */

export const SITE = {
  url: "https://kastriottanaj.com",
  name: "Kastriot Tanaj",
  title: "SEO & AI Automation for Businesses — Kastriot Tanaj",
  description:
    "Grow traffic, win better leads, and save time with SEO, digital marketing, and AI automation across Europe. Book a strategy call.",
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

/** Social profiles, in the order they're shown everywhere. The nav, the footer,
    /about/ and every schema.org `sameAs` read this one list, so a new channel
    is added here and nowhere else. `icon` is a sprite id from IconSprite. */
export const SOCIALS = [
  {
    label: "LinkedIn",
    handle: "/in/seo-kastriot-tanaj",
    href: SITE.linkedin,
    icon: "#i-linkedin",
  },
  {
    label: "YouTube",
    handle: "@Kastriot-Tanaj",
    href: "https://www.youtube.com/@Kastriot-Tanaj",
    icon: "#i-youtube",
  },
  {
    label: "Instagram",
    handle: "@kastriot.tanajj",
    href: "https://www.instagram.com/kastriot.tanajj/",
    icon: "#i-instagram",
  },
  {
    label: "Facebook",
    // A numeric profile URL rather than a vanity one — there is no handle to show.
    handle: "Kastriot Tanaj",
    href: "https://www.facebook.com/profile.php?id=61593745180902",
    icon: "#i-facebook",
  },
] as const;

/** The profile URLs alone — what schema.org's `sameAs` wants. */
export const SOCIAL_URLS = SOCIALS.map((s) => s.href);

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
  { href: "/about/", label: "About" },
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
