# Kastriot Tanaj — portfolio

Static site implemented from the Claude Design project
[Kastriot Tanaj Personal Website](https://claude.ai/design/p/1f35e520-108e-487c-8d5f-b9387a1c41f0)
(`Kastriot Tanaj Portfolio.dc.html`), built on that project's **Modernist** design system.

No build step and no dependencies — open `index.html`, or serve the folder:

```sh
python3 -m http.server 8000
```

Deployed on Vercel as a static site: framework preset **Other**, no build command, no
output directory, root `./`.

## Files

| File | What's in it |
| --- | --- |
| `index.html` | The page — semantic markup, no inline styles, Lucide icons as one inline SVG sprite |
| `ds/modernist.css` | The design system, vendored verbatim. Tokens + `.btn` / `.input` / `.field` / `.tag` / `.nav`. **Don't hand-edit** — re-export from the design project |
| `styles.css` | Page-level composition on top of the system |
| `script.js` | Mobile nav, scroll-spy, contact-form validation and submission |
| `assets/ai-seo.webp` | Hero image, exported from the design project's `uploads/` |

Colour, type and spacing all come from the `var(--…)` tokens in `ds/modernist.css`.
Retuning the `:root` block there moves the whole page at once.

## Before this goes live

1. **Contact form endpoint.** `ENDPOINT` at the top of [script.js](script.js) is empty. Until
   it's set, the form validates and shows its confirmation **but no message is delivered
   anywhere**. Point it at any endpoint that accepts a `POST` of `FormData`:

   ```js
   const ENDPOINT = "https://formspree.io/f/xxxxxxxx";
   ```

2. **CV.** The "Download CV" link points at `assets/kastriot-tanaj-cv.pdf`. Drop the PDF
   there or repoint the link.

3. **Seven placeholder links.** Carried over from the design as `href="#"` — three
   "View project →" in Featured results and four "Learn more →" in Services. They need real
   destinations or should come out; dead anchors hurt on a site selling SEO.

4. **Case-study copy.** The Gerti Foods blurb reads "Positioned SEO, on-page, as a market
   leader and expanded organic reach into new regions…" — that's garbled in the design
   file itself. Reproduced verbatim rather than guessed at; needs a rewrite.

## Swapping in real screenshots

Each placeholder is a `.thumb` figure. Replace the `<figcaption>` with an image and the
hatch pattern gets out of the way automatically:

```html
<figure class="thumb">
  <img src="assets/gerti-foods.jpg" alt="Gerti Foods packaging" width="800" height="600">
</figure>
```

Per Modernist, content photography goes through the `.grayscale` wrapper. The hero image is
the deliberate exception — the design file renders it in full colour, so it ships that way.

## Notes on the implementation

The design file is a `.dc.html` component that runs on the `dc-runtime` React harness in
`support.js`. Those constructs were translated to standard web platform equivalents:

- `<sc-if value="{{ submitted }}">` / `{{ notSubmitted }}` and the `DCLogic` component
  state → the form and its confirmation panel toggled in `script.js`.
- `{{ form.name }}` + `onChange` bindings → a native uncontrolled `<form>`, so it degrades
  to a normal submission and works with password managers and autofill.
- `_ds_bundle.js` is a no-op stub (empty namespace, zero components), so nothing from it
  is shipped.

Added beyond the design, since it was headed for production: page metadata and `Person`
JSON-LD, a skip link, labelled and error-messaged form fields, a honeypot, a nav that
collapses to a toggle under 820px rather than wrapping into ragged rows,
`prefers-reduced-motion` handling, and print styles.

Two deliberate divergences from the design file:

- **Nav alignment.** The design uses the system's bare `.nav`, whose 16px side padding
  leaves the header misaligned with the 32px content gutter below it. Aligned to the
  gutter, per the system's "keep everything flush left" rule.
- **Ruled grids.** The design draws the internal 2px rules in Services and Packages by
  bleeding a divider-coloured bed through the grid gap, which paints a grey block over the
  empty cells whenever the last row is part-full (any width where four service cards wrap
  to three columns). The cells now cast the rules into the gap themselves, so a part-full
  row terminates cleanly.
