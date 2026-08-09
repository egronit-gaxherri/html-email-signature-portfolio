# Deployment Guide

Covers three separate things, in the order you will need them:

1. [Preparing the email files for production](#1-preparing-the-email-files) — the mandatory image step
2. [Installing the signature](#2-installing-the-signature) — per client
3. [Deploying the portfolio website](#3-deploying-the-portfolio-website)

Plus [keeping `src/` and `dist/` in sync](#4-keeping-src-and-dist-in-sync).

---

## 1. Preparing the email files

### The one step you cannot skip

Both `dist/` files reference images with **relative paths**:

```
../src/assets/logo/northstar-logo-100.png
```

That is deliberate — it lets the browser previews work offline, straight out of the repository,
with no server and no CDN account. **It will not work in an email client.** Relative paths and
`file://` URLs never resolve in email. Every image would appear broken.

Before sending anything, the paths must become absolute HTTPS URLs.

### Step 1 — Upload the assets

Five files need hosting:

| File | Dimensions | Displayed at | Used by |
|---|---|---|---|
| `email-signature/src/assets/logo/northstar-logo-100.png` | 100×100 | 50×50 | Signature |
| `email-signature/src/assets/icons/linkedin-48.png` | 48×48 | 24×24 | Signature |
| `email-signature/src/assets/icons/x-48.png` | 48×48 | 24×24 | Signature |
| `email-signature/src/assets/icons/facebook-48.png` | 48×48 | 24×24 | Signature |
| `email-ad/src/assets/northstar-wordmark-320.png` | 320×80 | 160×40 | Advertisement |
| `email-ad/src/assets/hero-1200.png` | 1200×600 | 600×300 | Advertisement |

Each is served at 2× its display size so it stays sharp on retina and high-DPI screens.

Host requirements:

- **HTTPS** — mixed-content images are blocked by many clients
- **No authentication** — the recipient's mail client is an anonymous visitor
- **No hotlink protection** — it will block mail clients as effectively as it blocks scrapers
- **Stable URLs** — a signature lives in people's mail for years; a path change breaks all of it
- **CORS is irrelevant** — images are not fetched by script

Any of these work: a CDN (Cloudflare, Bunny, Fastly), object storage (S3, R2, Cloud Storage),
GitHub Pages, or simply a `/assets/` directory on the company's own web server. The company's
own domain is usually the best choice — it is one less third party in the delivery path.

Keep the SVG sources in the repository. They are the masters; the PNGs are generated from them:

```bash
rsvg-convert -w 100 -h 100 northstar-logo.svg -o northstar-logo-100.png
```

### Step 2 — Rewrite the paths

Every path shares the same `../src/assets/` prefix, so a single find/replace does the whole job.

From the project root, with your real host substituted:

```bash
sed -i '' 's|\.\./src/assets/|https://cdn.example.com/northstar/|g' email-signature/dist/signature.html
```

```bash
sed -i '' 's|\.\./src/assets/|https://cdn.example.com/northstar/|g' email-ad/dist/email-ad.html
```

On Linux, drop the `''` after `-i`.

Note this flattens the directory structure: `../src/assets/logo/northstar-logo-100.png` becomes
`https://cdn.example.com/northstar/logo/northstar-logo-100.png`, so upload the `logo/` and
`icons/` subdirectories as they are.

### Step 3 — Verify before sending

```bash
grep -n 'src="' email-signature/dist/signature.html
```

- [ ] Every `src` begins with `https://`
- [ ] No `../` remains anywhere
- [ ] Each URL opens in a private browser window with no login
- [ ] Images are the expected dimensions and under 200KB
- [ ] Replace the placeholder contact details, social URLs, and unsubscribe link

Do this rewrite on a **copy** if you want the repository previews to keep working — or keep the
committed version relative and rewrite as a release step. The second is cleaner.

---

## 2. Installing the signature

The general pattern is the same everywhere: open the rendered file in a browser, select all,
copy, and paste into the signature editor. You are copying the *rendered* result, not the source
code — the mail client's editor converts it back to HTML on paste.

Open `email-signature/dist/signature.html` in a browser first (after the path rewrite), then:

### Outlook Classic (Windows)

1. Select all (`Ctrl+A`) and copy (`Ctrl+C`) from the browser
2. Outlook → **File → Options → Mail → Signatures**
3. **New**, name it, then paste into the edit area
4. Set it as default for **New messages** and **Replies/forwards**
5. **OK**, then send yourself a test message

Outlook rewrites pasted HTML fairly aggressively. If the result is mangled, the more reliable
route is editing the signature file directly:

```
%USERPROFILE%\AppData\Roaming\Microsoft\Signatures\
```

Create the signature once in Outlook so the files exist, then replace the `.htm` file's contents
with the production HTML. Restart Outlook afterwards.

### Outlook New / Outlook Web

1. **Settings → Mail → Compose and reply**
2. Paste into the signature editor
3. Choose whether it applies to new messages, replies, or both
4. **Save**

Outlook New's editor is more restrictive than the desktop version. Check the spacing after
pasting — that is where it usually differs.

### Gmail

1. **Settings → See all settings → General → Signature → Create new**
2. Paste into the editor
3. **Save Changes** at the bottom of the page — easy to miss

Gmail strips some styling on paste and caps signatures at 10,000 characters. This one is well
under. If the layout collapses, the usual cause is Gmail rewriting the nested tables; simplify
the outer wrapper rather than fighting it.

### Apple Mail (macOS)

1. **Mail → Settings → Signatures**
2. Create a signature, then paste
3. **Uncheck "Always match my default message font"** — otherwise Apple Mail overrides the
   styling entirely. This step is the one people miss.

For a stubborn result, edit the file directly:

```
~/Library/Mail/V*/MailData/Signatures/
```

Quit Mail first, or it will overwrite your changes on exit.

### iOS Mail

iOS only supports plain-text signatures in Settings. To get a formatted one: send yourself the
signature from a desktop client, open it on the phone, copy the rendered signature, and paste it
into **Settings → Mail → Signature**. Formatting survives inconsistently. A plain-text fallback
is often the more honest choice on iOS.

---

## 3. Deploying the portfolio website

The portfolio is static HTML, CSS, and vanilla JavaScript. No build step, no dependencies, no
Node. Any static host serves it as-is.

### Important: the site links outside its own directory

`portfolio/index.html` links to `../email-signature/preview/index.html` and the `dist/` files.
**Deploy the whole project directory, not just `portfolio/`**, or every project link will 404.

### GitHub Pages

```bash
git init
git add .
git commit -m "HTML email signature portfolio"
git branch -M main
git remote add origin https://github.com/<username>/html-email-signature-portfolio.git
git push -u origin main
```

Then **Settings → Pages → Source: main / root**. The site appears at:

```
https://<username>.github.io/html-email-signature-portfolio/portfolio/
```

To serve the portfolio at the root instead, add an `index.html` at the project root that
redirects to `portfolio/`.

### Netlify / Vercel / Cloudflare Pages

Connect the repository and deploy with **no build command** and the **project root** as the
publish directory. All three detect static sites automatically.

### Any web server

Copy the project directory into the web root. Nothing needs configuring — there is no server-side
code and no routing.

### Post-deploy checks

- [ ] Portfolio loads and fonts render
- [ ] Both preview links work from the live site
- [ ] Both `dist/` links work
- [ ] Both `src/` links work
- [ ] Preview iframes load — they will, over HTTPS; the `file://` caveat does not apply
- [ ] Mobile navigation opens and closes
- [ ] No console errors
- [ ] Update the GitHub and LinkedIn URLs in `portfolio/index.html`, which are currently
      placeholders pointing at the site roots

---

## 4. Keeping `src/` and `dist/` in sync

There is no build tool in this project, by design: adding a Node toolchain to inline CSS into
two files would be more infrastructure than the problem warrants, and hand-inlining keeps full
control over what Outlook receives.

The cost is that `src/` and `dist/` must be updated together.

| Change | Update |
|---|---|
| Content, structure, links | `src/*.html` **and** `dist/*.html` |
| Colour, spacing, typography | `src/*.css` **and** the inline styles in `dist/*.html` |
| Responsive rules (ad only) | `src/email-ad.css` §9 **and** the `<style>` block in `dist/email-ad.html` |
| Images | Regenerate the PNG from its SVG, re-upload, update both |

The mapping is deliberately 1:1 — every rule in `src/*.css` has a counterpart in `dist/`, in the
same order, so a side-by-side diff is straightforward.

**Ship `dist/`. Never send `src/`.** The source files link an external stylesheet, which every
email client discards, so a sent `src/` file arrives completely unstyled.

If this project grows past two deliverables, adopt a proper inliner (Juice, Premailer, or MJML)
and generate `dist/` from `src/`. At two files, hand-maintenance is the smaller cost.

---

## Pre-flight checklist

Before anything reaches a real recipient:

- [ ] All image paths are absolute HTTPS URLs
- [ ] Every image loads from a logged-out browser
- [ ] Placeholder contact details replaced with real ones
- [ ] Social URLs point at real profiles
- [ ] Unsubscribe link is functional — legally required for marketing email
- [ ] Signature installed and sent as a test to at least one other account
- [ ] Rendering checked in the target clients per [`TESTING.md`](TESTING.md)
- [ ] Results recorded in [`../EMAIL_TESTING.md`](../EMAIL_TESTING.md)
