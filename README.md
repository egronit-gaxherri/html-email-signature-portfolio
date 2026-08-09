# HTML Email Signature & Advertisement Portfolio

> Hand-coded, Outlook-compatible HTML email deliverables, plus the portfolio website that
> presents them. No frameworks, no build step, no drag-and-drop builders.

---

## Overview

Two production-grade email HTML deliverables for **Northstar Digital Solutions**, a fictional
Los Angeles technology consultancy, and a portfolio website documenting how they were built.

1. **Corporate email signature** — table-based, fully inlined, every contact detail clickable
   and rendered as live text so it survives image blocking.
2. **Corporate email advertisement** — a 600px single-column promotional email with a hero
   image, benefit list, responsive breakpoint, MSO ghost table, and a VML CTA button.
3. **Portfolio website** — a static site presenting both, with a case study covering the
   specific constraints hit and the decisions made at each one.

Northstar Digital Solutions is fictional. This is a self-initiated portfolio project, not
client work.

**Compatibility status:** *Designed for compatibility. Requires final verification in the target
email client.* No live email client testing has been performed on these files. See
[Testing](#testing).

---

## Project structure

```
html-email-signature-portfolio/
│
├── README.md                     This file
├── EMAIL_TESTING.md              Deliverable expectations + pre-flight checklist
├── .gitignore
│
├── email-signature/
│   ├── src/                      Development: HTML and CSS kept separate
│   │   ├── signature.html
│   │   ├── signature.css
│   │   └── assets/
│   │       ├── logo/             SVG master + generated PNG
│   │       └── icons/            SVG masters + generated PNGs
│   ├── dist/
│   │   └── signature.html        PRODUCTION — inlined, MSO-hardened, send this
│   └── preview/
│       ├── index.html            Browser preview harness
│       ├── preview.css
│       └── assets/
│
├── email-ad/
│   ├── src/
│   │   ├── email-ad.html
│   │   ├── email-ad.css
│   │   └── assets/               SVG masters + generated PNGs
│   ├── dist/
│   │   └── email-ad.html         PRODUCTION — inlined, ghost table, VML button
│   └── preview/
│       ├── index.html
│       ├── preview.css
│       └── assets/
│
├── portfolio/
│   ├── index.html                Semantic markup only — no inline CSS or JS
│   ├── css/
│   │   ├── main.css              Tokens, reset, base, layout
│   │   ├── components.css        Navbar, hero, cards, table, case study, footer
│   │   └── responsive.css        Every breakpoint override, in one place
│   ├── js/
│   │   └── main.js               Nav, scrollspy, reveal, copy-to-clipboard
│   └── assets/
│       ├── images/
│       ├── icons/
│       └── fonts/
│
├── screenshots/                  Awaiting real client-rendering screenshots
│   ├── signature/
│   ├── email-ad/
│   └── portfolio/
│
└── docs/
    ├── TESTING.md                How to test, and what a browser cannot tell you
    ├── OUTLOOK.md                The Word engine, and every workaround applied
    └── DEPLOYMENT.md             Image hosting, per-client install, site deploy
```

---

## Features

**Email signature**
- Table-based layout, inline CSS throughout
- MSO conditional comments and DPI control
- Clickable phone, email, website, and address (Google Maps)
- LinkedIn / X / Facebook icons
- 2× retina assets displayed at 1×
- Every contact detail is live text — readable with images blocked
- Confidentiality notice
- Under 12KB, well below Gmail's clipping threshold

**Email advertisement**
- 600px centred card on a full-bleed canvas
- MSO ghost table for Outlook centring
- Bulletproof VML `roundrect` CTA with `anchorlock`
- Hidden preheader text for inbox list views
- Responsive below 620px: fluid hero, reduced gutters, full-width CTA
- Benefit list built from HTML entities, not icon images
- Unsubscribe link

**Portfolio website**
- Strict separation: markup, styling, and behaviour in separate files
- Three-file CSS architecture with a single breakpoint layer
- Accessible mobile navigation with `aria-expanded`, Escape, and outside-click dismissal
- Scrollspy via `IntersectionObserver`, exposed as `aria-current`
- Fully functional with JavaScript disabled
- Respects `prefers-reduced-motion`
- Skip link, visible focus rings, semantic landmarks

---

## Technical implementation

### `src/` and `dist/` — why both

Email HTML has one hard requirement that ordinary web development does not: **the CSS must be
inline**, because email clients strip `<link>` and treat `<style>` unpredictably. That produces
files which are correct but hostile to read and maintain.

So each deliverable exists twice:

| | `src/` | `dist/` |
|---|---|---|
| **Purpose** | Authoring and review | Sending |
| **CSS** | External stylesheet, classes | Inlined on every element |
| **Readable** | Yes | Not especially |
| **Send it?** | **No** — arrives unstyled | **Yes** |

`src/` is where the design is reasoned about. `dist/` is the compiled result — compiled by hand,
because introducing a Node toolchain to inline two files costs more than it saves. The mapping is
1:1 and ordered identically, so the two diff cleanly side by side.

The one rule: **change one, change the other.** See
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md#4-keeping-src-and-dist-in-sync).

### Email CSS constraints observed

| Rule | Reason |
|---|---|
| Inline CSS on every element | `<style>` blocks are stripped unpredictably |
| No external stylesheets | Blocked by every major client |
| No CSS Grid or Flexbox | No support in Outlook Classic |
| No web fonts | `@font-face` is stripped; fallback becomes unpredictable |
| No JavaScript | Stripped by every client, always |
| No Tailwind, Bootstrap, or any framework | All depend on external or embedded CSS |
| `Arial, Helvetica, sans-serif` | Renders consistently everywhere |
| Explicit `width` / `height` on images | Prevents reflow and DPI scaling artefacts |
| `display: block` on images | Removes the Outlook image gap |
| `border-collapse: collapse` | Removes phantom table spacing |

### Outlook-specific techniques

`OfficeDocumentSettings` with `AllowPNG` and `PixelsPerInch: 96`; an MSO conditional style block;
`mso-table-lspace` / `mso-table-rspace` resets; `mso-line-height-rule: exactly`; a ghost table
for centring; and a VML `roundrect` button with `anchorlock`.

Each is explained in [`docs/OUTLOOK.md`](docs/OUTLOOK.md).

### Portfolio CSS architecture

| File | Contains |
|---|---|
| `main.css` | Design tokens, reset, base typography, layout primitives, a11y utilities |
| `components.css` | Every component, desktop-first |
| `responsive.css` | Every breakpoint override — 1024 / 860 / 640 / 420 |

Breakpoints live in exactly one file, so there is one place to look when something breaks at a
given width. Load order is significant: `main` → `components` → `responsive`.

### Assets

Every image is generated from a committed SVG master via `rsvg-convert`:

```bash
rsvg-convert -w 100 -h 100 northstar-logo.svg -o northstar-logo-100.png
```

No third-party placeholder services. An earlier version of this project depended on
`via.placeholder.com`, which has since gone dark — every image in it is now broken. First-party
assets in the repository do not have that failure mode.

---

## Email development strategy

The governing principle: **build so it is already correct with zero CSS support, then enhance.**

Outlook Classic discards the entire `<style>` block, including every media query. Anything that
only works because a media query fired does not work in the single most common corporate email
client. So the inline 600px layout is designed to be genuinely acceptable on its own — the
responsive rules improve it, they do not rescue it.

The same reasoning drives the rest:

- **Live text over images**, because corporate gateways block images by default. If the
  signature were an image, a blocked-image inbox would show nothing at all.
- **Entity checkmarks over icon files**, for the same reason.
- **Accept square corners** rather than replacing rounded elements with images.
- **Two representations of each file**, because readability and deliverability genuinely conflict
  here, and pretending otherwise produces one file that is bad at both.

---

## Testing

**No live email client testing has been performed on these files.**

Everything here follows documented client constraints and established practice, but reasoning is
not testing. The phrasing used throughout — *"Designed for compatibility"* and *"Requires final
verification in the target email client"* — is precise, not hedging.

- [`docs/TESTING.md`](docs/TESTING.md) — the procedure: browser, mobile, per-client, image
  blocking, dark mode, links
- [`EMAIL_TESTING.md`](EMAIL_TESTING.md) — per-deliverable expected behaviour and the pre-flight
  checklist
- [`screenshots/`](screenshots) — empty, awaiting real client screenshots

What *has* been verified, in a browser, on a local server: both preview pages render, all six
image assets load, the advertisement's media query fires at 375px, the signature has no
horizontal overflow at 375px, the portfolio has no console errors and no page-level horizontal
overflow, mobile navigation opens and closes correctly, and all 35 internal links resolve.

That is browser verification. It says nothing about Outlook.

---

## Installation

No dependencies, no build step, no package manager.

```bash
git clone https://github.com/<username>/html-email-signature-portfolio.git
cd html-email-signature-portfolio
```

Optional, to regenerate PNG assets from their SVG masters:

```bash
brew install librsvg
```

---

## Preview

The preview pages load the production files in an `<iframe>`, so the preview and the shipped
file cannot drift apart. Some browsers block local iframes over `file://`, so serve the project
over HTTP:

```bash
python3 -m http.server 5533
```

| Page | URL |
|---|---|
| Portfolio | <http://localhost:5533/portfolio/index.html> |
| Signature preview | <http://localhost:5533/email-signature/preview/index.html> |
| Advertisement preview | <http://localhost:5533/email-ad/preview/index.html> |

Both preview pages are labelled **"Browser Preview — Not an Outlook Rendering Test"**, and each
lists explicitly what it does and does not demonstrate.

---

## Deployment

Full instructions in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

**The one mandatory step:** the `dist/` files reference images with relative paths so the
previews work offline. Relative paths never load in an email client. Upload the assets to HTTPS
hosting and rewrite the paths before sending:

```bash
sed -i '' 's|\.\./src/assets/|https://cdn.example.com/northstar/|g' email-signature/dist/signature.html
```

The portfolio is static — deploy the **whole project directory**, not just `portfolio/`, since
the site links out to the preview and dist files.

---

## Known limitations

1. **Not tested in any email client.** The most significant limitation. Everything else follows
   from documented constraints; this one is simply outstanding work.

2. **Relative image paths in `dist/`.** A deliberate trade for offline previews, and a foot-gun
   if the rewrite step is skipped. Flagged in a banner at the top of both files, in the README,
   and in the deployment guide.

3. **`src/` and `dist/` are hand-synced.** No build step means no automated guarantee they match.
   Acceptable at two deliverables; adopt an inliner beyond that.

4. **VML button width is fixed.** Change the CTA label and the `width` in the `<v:roundrect>`
   must be updated manually or the text will crowd inside the shape.

5. **Square corners in Outlook Classic.** `border-radius` is unsupported by the Word engine.
   Accepted deliberately — the alternative is image-based buttons, which fail when images are
   blocked.

6. **No real dark mode control.** Client support is not there yet. The design degrades
   gracefully under forced inversion rather than attempting to override it.

7. **Preview iframe heights are fixed.** The harness is deliberately JavaScript-free, so frame
   heights are measured values rather than computed ones. Substantially longer content would
   need them adjusting.

8. **Placeholder identity data.** Contact details, social URLs, and the GitHub/LinkedIn links in
   the portfolio are placeholders.

---

## Why this project matters

HTML email is a genuinely separate discipline from web development, and it is one that most
frontend developers never touch. The constraints are not a subset of web constraints — they are
a different set entirely, and several of them contradict what modern web development teaches.

What this project demonstrates:

- **Working inside hard constraints** rather than around them. No framework can solve Outlook;
  you either understand the Word engine or you do not.
- **Hand-written HTML and CSS.** Every line has a reason, and the reason is documented.
- **Progressive enhancement taken literally.** The email works with zero CSS support. The
  portfolio works with zero JavaScript.
- **Failure-mode thinking.** Images blocked, style block stripped, media queries ignored,
  colours inverted — each is a real state the deliverable has to survive.
- **Honest reporting.** Nothing is claimed as tested that has not been tested. That distinction
  is worth more in professional practice than an inflated compatibility matrix.
- **Maintainable structure.** Separated concerns, a documented `src`/`dist` relationship, and
  documentation that explains reasoning rather than just listing steps.

---

## Portfolio usage

Presenting this in an application or interview:

- **Lead with the case study section** on the portfolio site. It is the strongest part — seven
  concrete problems with the specific decision made at each. Constraint-handling is the actual
  skill on display.
- **Have `dist/signature.html` open.** The MSO conditionals, VML block, and inline styling read
  as domain knowledge that cannot be faked.
- **Be direct about what is untested.** "Designed for compatibility, not yet client-verified" is
  a stronger answer than an unqualified claim, and it is one a competent interviewer will check.
- **`docs/OUTLOOK.md` is the deep-dive.** It explains the Word engine from first principles.
- **Fill in `screenshots/`** when there is access to real clients. It is the one thing that would
  move this from "designed for" to "verified in".

---

## Licence

Created for portfolio and demonstration purposes. "Northstar Digital Solutions" is fictional; all
content and assets are original to this project.

---

*Built by Niko (Egronit Gaxherri) — HTML Email Developer*
