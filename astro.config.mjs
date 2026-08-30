// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import node from "@astrojs/node";
const SITE_URL = "https://kastriottanaj.com";

export default defineConfig({
  site: SITE_URL,

  // Static by default: every page is HTML on disk at build time. The exceptions
  // are the routes under src/pages/api/, which opt out with `prerender = false`.
  output: "static",

  // Caddy serves dist/client directly; this server handles /api/* only.
  adapter: node({ mode: "standalone" }),

  // Downloaded and self-hosted at build time — no request to fonts.googleapis.com,
  // and Astro emits the preload link plus a metric-matched fallback.
  fonts: [
    {
      name: "Archivo",
      cssVariable: "--font-archivo",
      provider: fontProviders.google(),
      weights: [400, 600, 800],
      styles: ["normal"],
      // latin only: `preload` preloads every subset, and the latin-ext file was
      // 32 KB of render-blocking bandwidth for glyphs no page uses. Albanian's
      // ë and ç live in latin (U+00C0-00FF); the arrows and box-drawing
      // characters in the copy fall outside both subsets either way.
      subsets: ["latin"],
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
