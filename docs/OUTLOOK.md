# Outlook Compatibility

Outlook is not one client. It is at least three rendering engines wearing the same name, and
knowing which one you are dealing with determines every technical decision that follows.

| Product | Engine | Behaviour |
|---|---|---|
| Outlook 2007–2021, Windows desktop | **Microsoft Word** | The restrictive one. Everything below is about this. |
| Outlook for Mac | WebKit | Broadly capable, close to Apple Mail |
| Outlook.com / Outlook Web | Browser engine | Capable, but rewrites CSS |
| Outlook New (Windows/Mac) | Chromium/Edge (WebView2) | Capable; a rebuilt client, not the Word one |

When email developers say "Outlook breaks it", they mean Outlook Classic on Windows. It is still
widely deployed across enterprise environments, which is exactly the audience for a corporate
signature — so it is the constraint this project is built around.

---

## Why the Word engine changes everything

Microsoft moved Outlook's rendering from Internet Explorer to Word in Outlook 2007. Word is a
word processor. It lays out documents in flowed text and tables, and it has no reason to
implement a browser's box model.

The consequence is not "Outlook has bugs". It is that Outlook is rendering your email with
software that was never designed to render HTML at all.

### What Word ignores

| Feature | Behaviour in Outlook Classic |
|---|---|
| `<style>` blocks | Largely discarded, including every media query |
| External stylesheets | Never loaded |
| Flexbox and Grid | No support whatsoever |
| `max-width` | Ignored |
| `min-width` / `min-height` | Ignored |
| `margin: auto` centring | Ignored |
| `background-image` on most elements | Unreliable; needs VML |
| `border-radius` | Ignored — corners render square |
| `box-shadow`, `opacity`, `transform` | Ignored |
| `float`, `position` | Unreliable |
| Padding on `<div>` and `<a>` | Unreliable; apply to `<td>` instead |
| `<svg>` | Not rendered |
| `@font-face` | Stripped |
| JavaScript | Stripped, always, in every client |

### What Word honours

- Tables, nested as deeply as you need
- Inline `style` attributes on `<td>` elements
- `width` and `height` HTML attributes
- Basic typography: `font-family`, `font-size`, `color`, `font-weight`
- `background-color` on `<td>`
- `border` on `<td>`
- VML, Microsoft's own vector language
- MSO-prefixed CSS properties

The workable subset is narrow, and it is essentially the HTML of 1999. That is not nostalgia —
it is the intersection of what every engine still agrees on.

---

## Techniques applied in this project

Every item below appears in the two `dist/` files. This section explains why.

### 1. `OfficeDocumentSettings` — DPI and PNG handling

```html
<!--[if gte mso 9]>
<xml>
  <o:OfficeDocumentSettings>
    <o:AllowPNG/>
    <o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings>
</xml>
<![endif]-->
```

**`PixelsPerInch`** — on a high-DPI Windows display, Word scales images by the system DPI
setting. A 50px logo can arrive at 63px or 75px, blowing out the layout and blurring the image.
Pinning to 96 forces 1:1 pixel mapping.

**`AllowPNG`** — without it, Outlook may transcode PNGs to BMP, which destroys transparency and
inflates the message size.

### 2. MSO conditional style block

```html
<!--[if mso]>
<style type="text/css">
  table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  td, span, a { font-family: Arial, Helvetica, sans-serif !important; }
</style>
<![endif]-->
```

Outlook ignores most of a `<style>` block, but it does honour a small set of properties from
one. This is where the table-spacing reset and the font enforcement go. Other clients never see
it — the conditional comment hides it from them.

### 3. Table spacing resets

```css
border-collapse: collapse;
mso-table-lspace: 0pt;
mso-table-rspace: 0pt;
```

Word inserts horizontal spacing around tables that exists in no browser. These three
declarations, applied to every table, are what stop the phantom gaps. They are the single most
common cause of "it looks fine in the browser but has weird gaps in Outlook".

### 4. Ghost tables

Outlook honours neither `max-width` nor `margin: auto`, so a centred 600px card simply will not
centre. The fix is a fixed-width table that only Outlook can see:

```html
<!--[if mso]>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" align="center"><tr><td>
<![endif]-->

  <!-- the real, responsive container -->

<!--[if mso]>
</td></tr></table>
<![endif]-->
```

Outlook obeys the `width="600"` attribute. Every other client skips the comment entirely and
uses the fluid container. Used in `email-ad/dist/email-ad.html`.

### 5. VML buttons

A padded `<a>` collapses to plain text in Outlook: the background disappears and only the words
remain clickable. The bulletproof pattern gives Outlook a real vector shape instead:

```html
<!--[if mso]>
<v:roundrect href="https://..." style="height:46px;v-text-anchor:middle;width:250px;"
             arcsize="11%" strokecolor="#1a6b54" fillcolor="#1a6b54">
  <w:anchorlock/>
  <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">
    Book a Free Consultation
  </center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="https://..." style="display:inline-block; padding:13px 32px; ...">Book a Free Consultation</a>
<!--<![endif]-->
```

`<w:anchorlock/>` makes the entire shape clickable rather than just the text. `arcsize` is a
percentage, so it is the VML equivalent of `border-radius`.

This requires the VML namespaces on the `<html>` element:

```html
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
```

**The trade-off:** VML dimensions are fixed in pixels. Change the button label and the `width`
must be updated by hand, or the text will crowd or float inside the shape. This is a real
maintenance cost, and it is recorded as a known limitation.

### 6. `mso-line-height-rule: exactly`

Word interprets `line-height` loosely and adds its own leading. Pairing every `line-height`
with `mso-line-height-rule: exactly` forces it to use the stated value. Without this, vertical
rhythm drifts in Outlook only.

### 7. `display: block` on every image

Outlook adds a few pixels of space beneath inline images — the classic "image gap". Setting
`display: block` removes it. Every `<img>` in both deliverables carries it.

### 8. `-ms-interpolation-mode: bicubic`

Improves the quality of downscaled images in Outlook and IE-derived engines. Relevant here
because every asset is served at 2× and displayed at 1×.

---

## Known degradation, accepted deliberately

These are consequences of the Word engine that are not worth fighting.

**Square corners.** `border-radius` does not exist in Outlook Classic. The logo, social icons,
and CTA render with square corners. Nothing breaks, nothing becomes unreadable, and the only
workaround is replacing them with images — which fail when images are blocked. Accepting square
corners is the better trade.

**No media queries.** The `<style>` block is discarded, so the advertisement shows its inline
600px layout in Outlook regardless of window size. This is precisely why the 600px layout is
designed to be acceptable on its own rather than treated as a fallback.

**No dark mode control.** Outlook applies its own colour transforms. The design uses colours
that survive inversion rather than attempting to override it.

---

## Debugging checklist

When something renders wrong in Outlook and nowhere else, work through this in order.

1. **Is the CSS inline?** If it is in a `<style>` block, Outlook is not reading it.
2. **Are you using a `<div>` for layout?** Convert it to a table.
3. **Unexpected gaps?** Missing `border-collapse: collapse` or `mso-table-lspace: 0pt`.
4. **A gap under an image?** Missing `display: block`.
5. **Wrong width?** Word is ignoring `max-width` — add a ghost table.
6. **Image too large or blurry?** Missing `PixelsPerInch`, or the image lacks explicit
   `width`/`height` attributes.
7. **Button showing as bare text?** Missing the VML fallback.
8. **Line spacing wrong?** Missing `mso-line-height-rule: exactly`.
9. **Padding not applying?** Move it from the `<div>` or `<a>` onto the containing `<td>`.
10. **Font not applying?** Declare `font-family` on the cell itself, not only on an ancestor.

---

## Reference

- [Can I Email](https://www.caniemail.com) — per-client support tables, the fastest answer to
  "will this work"
- [Campaign Monitor CSS support guide](https://www.campaignmonitor.com/css/)
- [VML reference (buttons)](https://buttons.cm) — generates VML button markup
- [Litmus: Outlook rendering](https://www.litmus.com/blog/) — background on the Word engine

---

## Status

Every technique above is applied as documented in the `dist/` files. **None of it has been
verified against a running copy of Outlook.** The reasoning is sound and follows established
practice, but reasoning is not testing. Before shipping to a real audience, run the procedure in
[`TESTING.md`](TESTING.md) and record what actually happened.
