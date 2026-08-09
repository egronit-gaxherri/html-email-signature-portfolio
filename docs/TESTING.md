# Testing Guide

> **Status of this project:** Designed for compatibility. **No live email client testing has
> been performed on these files.** This document describes the procedure to follow, not results
> already obtained. Nothing in this repository should be described as "tested" until someone has
> actually run these steps and recorded what they saw.

This is the *how to test* document. For the deliverable-specific expectations and the
pre-flight checklist, see [`../EMAIL_TESTING.md`](../EMAIL_TESTING.md). For Outlook internals,
see [`OUTLOOK.md`](OUTLOOK.md). For hosting and installation, see [`DEPLOYMENT.md`](DEPLOYMENT.md).

---

## 1. Running the previews locally

The preview pages load the production files through an `<iframe>`. That guarantees the preview
and the shipped file can never drift apart, but it means some browsers will refuse to load the
frames over `file://`. Serve the project over HTTP instead.

From the project root:

```bash
python3 -m http.server 5533
```

Then open:

| Page | URL |
|---|---|
| Portfolio website | <http://localhost:5533/portfolio/index.html> |
| Signature preview | <http://localhost:5533/email-signature/preview/index.html> |
| Advertisement preview | <http://localhost:5533/email-ad/preview/index.html> |

If the preview frames are blank, you are almost certainly on `file://`. Start the server.

---

## 2. What a browser preview can and cannot tell you

This is the single most important distinction in email development, and the reason the preview
pages carry a warning banner.

**A browser preview verifies:**

- The HTML is well-formed and the tables nest correctly
- Spacing, typography, colour, and alignment are as intended
- Images resolve and are the right dimensions
- Links point where they should
- Media queries fire at the intended breakpoint (in clients that honour them)

**A browser preview cannot verify anything about:**

- Outlook Classic — it renders through Microsoft Word, not a browser engine
- Gmail — it strips and rewrites CSS before you ever see it
- Dark mode colour inversion, which each client implements differently
- Image blocking, unless you explicitly disable images
- Message clipping, spam scoring, or deliverability

Your browser is the most permissive rendering environment the email will ever meet. Passing
there is a floor, not a ceiling.

---

## 3. Browser testing

Test the previews and the portfolio in at least Chrome, Firefox, and Safari.

- [ ] Layout renders identically across all three
- [ ] No horizontal scrollbar on the page at any width
- [ ] Fonts fall back gracefully with the network throttled or offline
- [ ] Portfolio navigation, scrollspy, and copy-to-clipboard all work
- [ ] Portfolio remains fully readable with JavaScript disabled
- [ ] Keyboard-only pass: every interactive element is reachable and has a visible focus ring

### Simulating blocked images

The single highest-value test for a signature, because corporate gateways block images by default.

1. Chrome: Settings → Privacy and security → Site settings → Images → Don't allow
2. Reload the preview
3. Confirm the alt text reads sensibly and the layout does not collapse
4. Confirm every contact detail is still present — none of it should live inside an image

---

## 4. Mobile testing

### In the browser

Use device emulation at 320px, 375px, and 414px widths.

- [ ] No horizontal overflow at 320px, the narrowest width worth supporting
- [ ] Text remains legible without zooming
- [ ] Tap targets are at least 44×44px
- [ ] The advertisement's hero image scales fluidly
- [ ] The advertisement's CTA becomes full-width below 620px

### On real devices

Emulation does not reproduce how a real mail app wraps content. Send a genuine test message and
open it on:

- [ ] iPhone — Apple Mail
- [ ] iPhone — Gmail app
- [ ] Android — Gmail app
- [ ] Android — Outlook app

---

## 5. Email client testing

This is the part that actually counts, and the part that has not been done.

### Method A — manual send tests (free)

1. Paste the signature into a real signature editor, or paste the advertisement HTML into a
   sending tool
2. Send to accounts on each target platform
3. Screenshot every result at full size
4. Store the screenshots in [`../screenshots/`](../screenshots) and note what differs

The `screenshots/` directory is organised by deliverable and is currently empty — it is waiting
for exactly these results.

### Method B — rendering services (paid)

Litmus or Email on Acid render across dozens of clients at once. Worth it if you send email
regularly; overkill for a one-off signature.

### Client matrix

Record an actual observation against each row. Leave it blank rather than guessing.

| Client | Platform | Status |
|---|---|---|
| Outlook Classic 2016 / 2019 / 2021 | Windows | Not yet tested |
| Outlook New | Windows | Not yet tested |
| Outlook | macOS | Not yet tested |
| Outlook Web | Browser | Not yet tested |
| Gmail | Web | Not yet tested |
| Gmail app | iOS / Android | Not yet tested |
| Apple Mail | macOS | Not yet tested |
| Apple Mail | iOS | Not yet tested |
| Yahoo Mail | Web | Not yet tested |
| Thunderbird | Desktop | Not yet tested |

---

## 6. Per-area checks

### Images

- [ ] Every `src` is an absolute `https://` URL — relative and `file://` paths never load in email
- [ ] Both `width` and `height` attributes are present on every image
- [ ] Assets are served at 2× and displayed at 1× for retina clarity
- [ ] Every image carries descriptive `alt` text
- [ ] Each image is under 200KB
- [ ] The host does not require authentication, and does not hotlink-protect

### Fonts

- [ ] No `@font-face`, no web fonts anywhere in the email output
- [ ] `Arial, Helvetica, sans-serif` declared on every text-bearing cell, not just an ancestor
- [ ] Rendering checked on both Windows and macOS — Arial and Helvetica differ in metrics

### Links

- [ ] `tel:` opens the dialer on mobile
- [ ] `mailto:` opens a compose window with the address filled in
- [ ] The website link resolves, including the `https://` scheme
- [ ] The address link opens the correct location in Google Maps
- [ ] All three social links resolve to the right profiles
- [ ] The CTA resolves, and the VML button is clickable across its whole area in Outlook
- [ ] The unsubscribe link resolves
- [ ] No link colour has been silently overridden by the client

### Dark mode

Enable dark mode at OS level, then reopen the message in Apple Mail, Outlook New, and the Gmail app.

- [ ] Text remains legible after inversion
- [ ] The logo remains visible against an inverted background
- [ ] Link colour retains sufficient contrast
- [ ] Nothing becomes dark text on a dark background

Full colour-scheme control is not achievable with today's client support. The design aims to
degrade gracefully rather than to control the outcome.

### Responsive behaviour

- [ ] Signature holds together from 320px upward without media queries
- [ ] Advertisement is single-column and readable at 600px in clients that strip the style block
- [ ] Advertisement goes fluid below 620px where media queries are honoured
- [ ] Nothing depends on a media query for basic legibility

---

## 7. Recommended tools

| Tool | Purpose | Cost |
|---|---|---|
| [Can I Email](https://www.caniemail.com) | Per-client CSS and HTML support reference | Free |
| [Mail Tester](https://www.mail-tester.com) | Spam score and deliverability | Free |
| [HTML Email Check](https://www.htmlemailcheck.com) | Email-specific HTML validation | Free |
| [Litmus](https://litmus.com) | Multi-client rendering screenshots | Paid |
| [Email on Acid](https://www.emailonacid.com) | Multi-client testing and analytics | Paid |
| Manual send tests | Ground truth | Free |

`caniemail.com` is the one to keep open while writing email HTML. It answers "does this client
support this property" faster than any amount of trial and error.

---

## 8. Recording results

When a client has genuinely been tested:

1. Screenshot it and save to `screenshots/<deliverable>/<client>-<platform>.png`
2. Update the matrix in section 5 with what you observed
3. Add any new degradation to the Known Limitations list in
   [`../EMAIL_TESTING.md`](../EMAIL_TESTING.md)
4. Update the compatibility table in `portfolio/index.html` so the site does not overstate
   the position

Only after that should the word "tested" appear anywhere. Until then, the correct phrasing is
**"Designed for compatibility"** or **"Requires final verification in the target email client."**
