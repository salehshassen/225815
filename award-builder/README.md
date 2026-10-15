# Award Builder (website)

Static website for designing acrylic recognition awards (دروع تكريمية). Hosted on GitHub Pages.
Setup steps: see **SETUP.md** (Parts A–F).

## What runs where
- **In the browser (works without an account):** choosing shape and size, Arabic/English text, logo, live front preview with the
  iPhone 13 size reference, 3D view, draft drawing preview, validation messages, approval step.
- **On the server (requires Google sign-in and an active account):** every manufacturing file (PDF drawing, STL, DXF, artwork SVG/PNG,
  design record, ZIP package). The server validates the design against the administrator's rules, checks the account on every request,
  and logs each export. The code that writes these files is not in this folder.
- `privacy.html`, `terms.html` and `google969a58c9264a531c.html` (Google ownership verification) must stay in this folder when you redeploy.
- v0.4: the dashboard can block **downloads only** from specific IP addresses (see DEPLOY-IP-BANS.md); blocked visitors can still sign in and use previews.
- `admin.html` is the administrator dashboard. Anyone can open the page, but all data comes from the server, which only answers the
  administrator account.

## Files
- `index.html`, `admin.html`, `css/`, `js/app.js`, `js/admin.js`
- `js/core.js`: preview engine (shapes, Arabic text, layout, 3D mesh for the preview)
- `js/config.js`: your Supabase Project URL and **publishable** key (public values). Never put a secret key here; the site refuses to run if you do.
- `vendor/`: bundled libraries (no external requests); `assets/fonts.js` + `fonts/`: IBM Plex Sans Arabic

## Try it on your computer
From this folder: `python3 -m http.server 8000`, then open http://localhost:8000. Sign-in works locally once
`http://localhost:8000/**` is in Supabase's Redirect URLs (SETUP.md step 10).

## Licences
See THIRD_PARTY_NOTICES.md. Add your own licence for this project before sharing the code.
