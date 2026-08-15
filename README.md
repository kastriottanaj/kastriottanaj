# Kastriot Tanaj — portfolio

Static site implemented from the Claude Design project
[Kastriot Tanaj Personal Website](https://claude.ai/design/p/1f35e520-108e-487c-8d5f-b9387a1c41f0)
(`Kastriot Tanaj Portfolio.dc.html`), built on that project's **Modernist** design system.

No build step and no dependencies — open `index.html`, or serve the folder:

```sh
python3 -m http.server 8000
```

## Files

| File | What's in it |
| --- | --- |
| `index.html` | The page — semantic markup, no inline styles |
| `styles.css` | Modernist tokens (`--color-*`, `--font-*`, `--space-*`) + the page's component layer |
| `script.js` | Mobile nav, scroll-spy, contact-form validation and submission |

## Before this goes live

Two things need real assets:

1. **Contact form endpoint.** `ENDPOINT` at the top of [script.js](script.js) is empty. Until
   it's set, the form validates and shows its confirmation **but no message is delivered
   anywhere**. Point it at any endpoint that accepts a `POST` of `FormData` — Formspree,
   Basin, a Netlify function, your own API:

   ```js
   const ENDPOINT = "https://formspree.io/f/xxxxxxxx";
   ```

2. **CV.** The two "Download CV" links point at `assets/kastriot-tanaj-cv.pdf`. Drop the PDF
   there or repoint the links.

## Swapping in real screenshots

Each placeholder is a `.thumb` figure. Replace the `<figcaption>` with an image and the
hatch pattern gets out of the way automatically:

```html
<figure class="thumb thumb--4x3">
  <img class="grayscale" src="assets/sts-company.jpg" alt="STS Company website"
       width="800" height="600">
</figure>
```

`.grayscale` is the system's image wrapper — per Modernist, content photography prints in
pure black and white.

## Notes on the implementation

The design file is a `.dc.html` component that runs on the `dc-runtime` React harness in
`support.js`. Those constructs were translated to standard web platform equivalents:

- `style-hover="…"` → real `:hover` / `:active` rules, plus the system's
  `:focus-visible` ring (the accent on light ground, the ground colour on the red field).
- `<sc-if value="{{ submitted }}">` / `{{ notSubmitted }}` and the `DCLogic` component
  state → the form and its confirmation panel toggled in `script.js`.
- `{{ form.name }}` + `onChange` bindings → a native uncontrolled `<form>`, so it degrades
  to a normal submission and works with password managers and autofill.

Added beyond the design, since it was headed for production: page metadata and `Person`
JSON-LD, a skip link, labelled and error-messaged form fields, a honeypot, a nav that
collapses to a toggle under 860px rather than wrapping into ragged rows, `prefers-reduced-motion`
handling, and print styles.

One fix to the design's CSS: the ruled grids drew their internal 2px rules by bleeding a
divider-coloured bed through the grid gap, which paints a grey block over the empty cells
whenever the last row is part-full (visible with 4 case-study cards in a 3-column layout).
The cells now cast the rules into the gap themselves, so a part-full row terminates cleanly.
