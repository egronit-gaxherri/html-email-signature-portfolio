# Email Testing — Deliverable Reference

> **Project:** HTML Email Signature & Advertisement — Northstar Digital Solutions
> **Developer:** Niko (Egronit Gaxherri)
> **Status:** Designed for compatibility. Requires final verification in the target email client.

This document covers **what the two deliverables should do** and **what to check before
shipping**. For the testing procedure itself, see [`docs/TESTING.md`](docs/TESTING.md). For
Outlook internals, see [`docs/OUTLOOK.md`](docs/OUTLOOK.md).

---

## Scope

| Deliverable | Production file |
|---|---|
| Corporate email signature | `email-signature/dist/signature.html` |
| Corporate email advertisement | `email-ad/dist/email-ad.html` |

The `src/` files are authoring versions with an external stylesheet. **They are not sendable** —
an email client discards the `<link>` and the message arrives unstyled.

---

## Compatibility approach

Client constraints drove the architecture rather than being patched in afterwards:

- Table-based layout throughout — no Grid, no Flexbox, no positioned `<div>` layout
- All layout-critical CSS inlined on the element that needs it
- `Arial, Helvetica, sans-serif` on every text-bearing cell, not just an ancestor
- Explicit `width` and `height` on every image; 2× assets displayed at 1×
- MSO conditional comments for the Word rendering engine
- VML `roundrect` fallback for the advertisement's CTA
- `border-collapse: collapse` plus `mso-table-lspace` / `mso-table-rspace` on every table
- `mso-line-height-rule: exactly` alongside every `line-height`
- No JavaScript, no external CSS, no web fonts, no framework

---

## Compatibility matrix

| Email client | Status |
|---|---|
| Outlook Classic (2016–2021) | Designed for compatibility — requires verification |
| Outlook New (Windows / Mac) | Designed for compatibility — requires verification |
| Outlook Web | Designed for compatibility — requires verification |
| Gmail (Web) | Designed for compatibility — requires verification |
| Gmail (Android / iOS) | Designed for compatibility — requires verification |
| Apple Mail (macOS) | Designed for compatibility — requires verification |
| iPhone Mail (iOS) | Designed for compatibility — requires verification |
| Yahoo Mail | Designed for compatibility — requires verification |
| Thunderbird | Designed for compatibility — requires verification |

**"Designed for compatibility"** means the HTML architecture, CSS approach, and rendering
workarounds follow each client's documented constraints.

It does **not** mean tested. No live client testing has been performed on these files. No
rendering claim is made for any client in this table. Record real results using the matrix in
[`docs/TESTING.md`](docs/TESTING.md#5-email-client-testing) as they are obtained.

---

## Expected rendering — signature

**Structure:** two-column table — fixed 60px logo cell, fluid content cell — with a full-width
brand rule above and a confidentiality notice below.

| Element | Expected |
|---|---|
| Brand rule | 3px `#1a6b54` bar spanning the signature width |
| Logo | 50×50px block image, served at 100×100, 6px radius (square in Outlook) |
| Name | Arial bold 17px `#1a1a1a`, 22px line-height |
| Job title | Arial 13px `#555555`, 0.3px letter-spacing |
| Company | Arial bold 13px `#1a6b54` |
| Hairline | 1px `#d9d9d9` above the contact block |
| Contact rows | 12px, `P:` / `E:` / `W:` / `A:` labels in `#8a8a8a` |
| Phone / email / website | `white-space: nowrap` — must not break mid-value |
| Address | **Wraps deliberately** — `nowrap` here overflows narrow mobile viewports |
| Social icons | Three 24×24px icons, served at 48×48, 8px gaps |
| Disclaimer | 10px `#999999`, 14px line-height |

**Total height:** ~292px at both 600px and 375px width.

**With images blocked:** the alt text (`Northstar Digital Solutions`, `LinkedIn`, `X`,
`Facebook`) appears in place of the images. Every piece of contact information remains visible,
because none of it lives inside an image. This is the signature's most important behaviour.

---

## Expected rendering — advertisement

**Structure:** single column, 600px centred card on an `#f4f4f4` full-bleed canvas.

| Section | Expected |
|---|---|
| Preheader | Hidden in body; appears beside the subject in inbox list views |
| Header | 160×40px wordmark, served at 320×80, on white, 28px/40px padding |
| Hero | 600×300px image, served at 1200×600, fluid below 620px |
| Headline | Arial bold 26px, 34px line-height — 22px/29px on mobile |
| Body | Two paragraphs, 15px `#444444`, 24px line-height |
| Benefits | Four rows, HTML entity `&#10003;` checkmarks in brand green |
| CTA | "Book a Free Consultation", white on `#1a6b54`, 5px radius |
| Divider | 1px `#e0e0e0` |
| Footer | Company details, phone link, site link, unsubscribe |

**Total height:** ~1170px at 600px width, ~1223px at 375px.

**Below 620px:** container goes full width, hero image becomes fluid, gutters reduce 40px → 20px,
headline drops to 22px, CTA becomes full-width and centred.

**In Outlook:** the `<style>` block is discarded, so none of the above happens. Outlook shows
the inline 600px layout inside the MSO ghost table, with the VML button instead of the CSS one.
That layout is designed to be acceptable on its own — it is not a degraded fallback.

---

## Outlook Classic — issues and mitigations

| Issue | Mitigation |
|---|---|
| Ignores external and most embedded CSS | All layout-critical CSS inlined |
| No `border-radius` | Accepted; corners render square |
| Phantom table spacing | `mso-table-lspace: 0pt`, `mso-table-rspace: 0pt`, `border-collapse: collapse` |
| Ignores `max-width` and `margin: auto` | MSO ghost table at fixed `width="600"` |
| Padded `<a>` buttons collapse to text | VML `<v:roundrect>` with `<w:anchorlock/>` |
| DPI upscaling of images | `<o:PixelsPerInch>96</o:PixelsPerInch>` |
| PNG transcoded to BMP | `<o:AllowPNG/>` |
| Gap beneath images | `display: block` on every `<img>` |
| Loose `line-height` interpretation | `mso-line-height-rule: exactly` |
| Link colours overridden | Colour set inline on every `<a>`, repeated in the MSO block |

Full explanations in [`docs/OUTLOOK.md`](docs/OUTLOOK.md).

---

## Image loading

**Blocked by default:** Outlook Classic, most corporate gateways.
**Loaded by default:** Apple Mail, iPhone Mail, Gmail (generally).

Because blocking is the default in exactly the environment this signature targets, no essential
information is delivered by an image. Both deliverables remain fully comprehensible with images
off.

### Production hosting requirements

- Absolute `https://` URLs — relative and `file://` paths never load
- No authentication, no hotlink protection
- Stable URLs — a signature stays in circulation for years
- Under 200KB per image
- PNG for logos and icons; JPG for photographs
- Both `width` and `height` attributes always present

Current asset sizes, all comfortably within budget:

| Asset | Size |
|---|---|
| `northstar-logo-100.png` | ~2KB |
| `linkedin-48.png` / `x-48.png` / `facebook-48.png` | ~1KB each |
| `northstar-wordmark-320.png` | ~6KB |
| `hero-1200.png` | ~63KB |

---

## Font strategy

| Level | Font | Context |
|---|---|---|
| Primary | Arial | Universally available |
| Fallback | Helvetica | macOS / iOS |
| Generic | sans-serif | Everything else |

Web fonts are intentionally absent. Most clients strip `@font-face`, and the resulting fallback
is unpredictable — a font stack you did not choose, at metrics you did not design for. Arial is
consistent everywhere, which matters more than distinctiveness in a signature.

The portfolio website is a different context and does use web fonts, with a full system-font
fallback stack.

---

## Link behaviour

| Link | Format | Expected |
|---|---|---|
| Phone | `tel:+13105550187` | Opens the dialer on mobile; may prompt on desktop |
| Email | `mailto:alex.morgan@northstardigital.com` | Opens compose with To: filled |
| Website | `https://www.northstardigital.com` | Opens in the default browser |
| Address | Google Maps search URL | Opens Maps at the address |
| Social | `https://` profile links | Open in the default browser |
| CTA | `https://www.northstardigital.com/contact` | Opens in the default browser |
| Unsubscribe | `https://www.northstardigital.com/unsubscribe` | Opens in the default browser |

`target="_blank"` is set where supported; some clients ignore it and open in place.

---

## Mobile rendering

**Signature.** Compact by design and needs no media queries. The logo cell is fixed at 60px and
the content cell fills the remainder, which holds from roughly 300px upward. `nowrap` is applied
to the phone, email, and website rows, where breaking mid-value is genuinely damaging, and
deliberately *not* to the street address, which is long enough to force horizontal overflow.

*Verified in a browser at 375px: no horizontal overflow.*

**Advertisement.** Uses `@media only screen and (max-width: 620px)` to go full-width, make the
hero fluid, reduce gutters, shrink the headline, and make the CTA full-width.

*Verified in a browser at 375px: the media query fires and the CTA computes to `display: block`.*

Outlook strips the whole block, so it never sees any of this — hence the inline 600px layout
being designed to stand alone.

---

## Dark mode

| Concern | Approach |
|---|---|
| Text inversion | Specific dark values (`#1a1a1a`, `#555555`) that most clients invert cleanly |
| Background inversion | No background colour on the signature's outer container |
| Logo visibility | Brand-green tile with a white mark — legible on light and dark |
| Link colour | `#1a6b54` retains contrast against both |
| Images | Not inverted by clients; transparent PNGs behave best |

`meta name="color-scheme"` and `supported-color-schemes` are declared in both files.

**Limitation:** genuine dark mode control needs `@media (prefers-color-scheme: dark)` in an
embedded style block, which many clients strip. The approach here is graceful degradation, not
control.

---

## Known limitations

1. **Not tested in any email client.** Everything else here is reasoned from documented
   constraints; this is outstanding work, not a design decision.

2. **Relative image paths in `dist/`.** Deliberate, so previews work offline. Must be rewritten
   to absolute HTTPS URLs before sending — see
   [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md#1-preparing-the-email-files).

3. **VML button width is fixed at 250px.** Changing the CTA label requires updating the
   `<v:roundrect>` width by hand.

4. **Square corners in Outlook Classic.** Unsupported `border-radius`. Accepted.

5. **Social icons show alt text when images are blocked.** Standard behaviour; the icons are
   supplementary, not informational.

6. **Yahoo Mail table spacing.** Historically adds spacing around tables. `border-collapse` and
   the MSO resets mitigate it but may not eliminate it.

7. **Gmail clipping at ~102KB.** Both files are far below — the signature is ~12KB — but adding
   large inline content could approach it.

8. **`src/` and `dist/` are hand-synced.** No build step, so no automated guarantee.

---

## Pre-flight checklist

### Content
- [ ] Name, title, and company are correct
- [ ] Phone number is correct and dials properly
- [ ] Email address is correct and spelled exactly right
- [ ] Street address is correct and the Maps link resolves to it
- [ ] Social URLs point at real profiles
- [ ] Disclaimer wording approved
- [ ] No placeholder content remains

### Images
- [ ] Every `src` is an absolute `https://` URL
- [ ] No `../` remains in either `dist/` file
- [ ] Each URL loads in a logged-out private window
- [ ] Both `width` and `height` present on every image
- [ ] Every image under 200KB
- [ ] Alt text is descriptive, not a filename

### Rendering
- [ ] Desktop: correct at 1200px+
- [ ] Tablet: readable at 768px
- [ ] Mobile: no horizontal overflow at 375px
- [ ] Narrow: no horizontal overflow at 320px
- [ ] Images blocked: alt text sensible, layout intact, all contact details present
- [ ] Fonts fall back correctly to Arial / Helvetica / sans-serif

### Links
- [ ] `tel:` opens the dialer
- [ ] `mailto:` opens compose
- [ ] Website resolves
- [ ] Address opens the right Maps location
- [ ] All three social links resolve
- [ ] CTA resolves; VML button clickable across its full area in Outlook
- [ ] Unsubscribe resolves

### Spacing
- [ ] Logo aligns to the top of the contact block
- [ ] Name / title / company evenly spaced
- [ ] Divider rules in the right positions
- [ ] `P:` / `E:` / `W:` / `A:` labels aligned
- [ ] Social icons evenly spaced
- [ ] Disclaimer has correct top spacing

### Per client
- [ ] Outlook Classic — tables intact, no extra spacing, VML button renders
- [ ] Outlook New — layout intact, colours correct
- [ ] Gmail Web — no clipping, styles applied
- [ ] Gmail Android — readable, no overflow
- [ ] Gmail iOS — readable, links work
- [ ] Apple Mail macOS — full render, dark mode checked
- [ ] iPhone Mail — touch targets adequate, no overflow
- [ ] Yahoo Mail — spacing consistent

---

*Part of a self-initiated portfolio project. No email testing infrastructure was used during
development. All compatibility statements are based on documented client constraints and
established practice, not on observed results. Final verification must be performed in each
target client before production use.*
