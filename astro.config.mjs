// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import node from "@astrojs/node";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://kastriottanaj.com",

  // Static by default: every page is HTML on disk at build time. The single
  // exception is src/pages/api/lead.ts, which opts out with `prerender = false`.
  output: "static",

  // Caddy serves dist/client directly; this server handles /api/* only.
  adapter: node({ mode: "standalone" }),

  integrations: [
    sitemap({
      filter: (page) => !page.includes("/thanks"),
    }),
  ],

  // Downloaded and self-hosted at build time — no request to fonts.googleapis.com,
  // and Astro emits the preload link plus a metric-matched fallback.
  fonts: [
    {
      name: "Archivo",
      cssVariable: "--font-archivo",
      provider: fontProviders.google(),
      weights: [400, 600, 800],
      styles: ["normal"],
      subsets: ["latin", "latin-ext"],
      fallbacks: ["system-ui", "sans-serif"],
    },
  ],

  build: {
    inlineStylesheets: "auto",
  },

  security: {
    // Astro rejects cross-origin form POSTs by comparing the Origin header to
    // the URL it reconstructs. Behind Caddy the socket is plain HTTP, so
    // without this the reconstructed origin is http://… , the browser sends
    // https://… , and every real submission 403s. Listing the domains here is
    // what makes X-Forwarded-Proto trusted.
    checkOrigin: true,
    allowedDomains: [
      { hostname: "kastriottanaj.com", protocol: "https" },
      { hostname: "www.kastriottanaj.com", protocol: "https" },
    ],
  },
});
