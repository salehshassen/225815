# Award Builder

A static web app that lets non-technical customers design an acrylic recognition award (درع تكريمي) and download
manufacturing files that all come from the same set of parameters:

- **STL**: 3D geometry of the plaque and base (mm, two sealed bodies)
- **DXF**: 1:1 cutting outlines (R12, mm, one layer per operation)
- **PDF**: A3 engineering drawing with front, side and base views, dimensions, material, assembly and tolerances
- **SVG / PNG**: inscription and logo artwork, separate from the geometry (mirrored automatically for back-surface work)
- **JSON**: a design record with every input, rule and derived dimension
- **ZIP**: everything above plus a README for the manufacturer

Everything runs in the visitor's browser. There is no server, database or account.

## Run it on your computer

Option A (recommended): from this folder run

```
python3 -m http.server 8000
```

then open http://localhost:8000. (`npm start` does the same.)

Option B: double-click `index.html`. This usually works because the app makes no network requests, but some browsers
restrict saved drafts or downloads on `file://` pages, so use option A when testing.

## Publish on GitHub Pages

1. Create a new repository on GitHub, for example `award-builder`. On the free GitHub plan, Pages publishes from public repositories.
2. Put the contents of this folder at the root of the repository (so `index.html` sits at the top level):
   - **In the browser:** on the empty repository page choose *uploading an existing file*, drag in every file and folder
     from this folder, then *Commit changes*. If `.nojekyll` doesn't upload (it's a hidden file), that's fine: the site works without it.
   - **With git:**
     ```
     cd award-builder
     git init
     git add .
     git commit -m "Award Builder"
     git branch -M main
     git remote add origin https://github.com/YOUR-USERNAME/award-builder.git
     git push -u origin main
     ```
3. In the repository go to **Settings → Pages**. Under *Build and deployment* set **Source: Deploy from a branch**,
   **Branch: main**, folder **/ (root)**, then **Save**.
4. After a minute or two the site is live at `https://YOUR-USERNAME.github.io/award-builder/`.
   The *Actions* tab shows the deployment if you need to check progress.
5. Test the live site: pick a shape and size, type Arabic and English text, upload a logo, open the 3D tab, approve,
   and download the ZIP package. Open the PDF and DXF to confirm they look right.

To update the site, commit changed files to `main`. GitHub republishes automatically. Browsers may cache the old version
for a few minutes; reload with Ctrl+Shift+R (Cmd+Shift+R on Mac) if you don't see a change.

All paths are relative, so the site also works on a custom domain or in a sub-folder.

## What works on GitHub Pages

Everything in the customer flow works as a static site: shape and size selection, the live preview with the iPhone 13
size reference, Arabic shaping and right-to-left layout, the 3D view, validation and warnings, the manufacturer-rules
panel, approval, and every download. Downloads use the browser's normal download mechanism. On iPhone and iPad,
Safari may show a preview or share sheet instead of saving straight to a folder.

## What does not work, or is limited, on a static host

- **No order handling.** Designs are not sent anywhere. The customer downloads the package and sends it to the manufacturer
  themselves (email, WhatsApp, etc.). Submitting orders, emailing files, payments and a central order list need a backend.
- **Drafts and rules live in one browser.** Work in progress and any manufacturer-rule edits are stored in that browser's
  local storage. They don't sync between devices and are lost if the browser data is cleared. All sites under the same
  `YOUR-USERNAME.github.io` address share that storage area.
- **The rules panel is visible to every visitor.** Anyone can change the rules in their own browser. To set the rules for
  everyone, edit `DEFAULT_RULES` in `js/core.js` and republish. For production, hide or protect the panel.
- **Approval is not a signature.** The approval step records a reference ID and time inside the files, but there is no login,
  so it doesn't prove who approved.
- **The site is public.** Anyone with the link can open it.
- **First load is about 2 MB** (bundled libraries and the Arabic font). Later visits load from the browser cache.

(When this app runs inside Claude, STL and DXF are delivered inside a .zip because of that viewer's file-type limits.
On GitHub Pages they download directly.)

## Sizes

Customers see centimetres; everything is stored and exported in millimetres. Presets set the plaque size above the base:

| Preset | Plaque width × height (above base) |
|---|---|
| Small | 12 × 16 cm |
| Medium | 15 × 20 cm |
| Large | 20 × 26 cm |

The height slider ("How tall?") is the plaque only and does **not** include the base; the app shows the base height and the
total standing height next to it. Presets are clamped to the active manufacturer rules and are disabled if they would break them.
Change them in `Core.SIZE_PRESETS` in `js/core.js`.

The phone silhouette uses Apple's published iPhone 13 dimensions (146.7 × 71.5 mm). It is a proportional reference;
the preview is scaled to fit the screen and is not shown at actual size.

## Prototype assumptions to confirm with your manufacturer

All values in the *Manufacturer rules* panel are prototype defaults. In particular, the slot-in base assumes the pocket is
**CNC-routed into a solid base block** (with router-radius relief in the pocket corners). The PDF and README in every
download list which rules are still unconfirmed.

## Project structure

```
index.html            page markup
css/app.css           styles
js/core.js            engine: shapes, validation, Arabic text, STL, DXF, drawing, artwork (no DOM)
js/app.js             interface: steps, previews, 3D view, downloads, Arabic/English UI
assets/fonts.js       IBM Plex Sans Arabic as base64 (used by the engine and the interface)
fonts/                the same font files and their licence (OFL)
vendor/               bundled libraries and their licences
tests/                engine-test.js (no install) and ui-smoke.js (needs npm install)
tools/build-fonts.js  regenerates assets/fonts.js from fonts/
```

## Tests

```
node tests/engine-test.js     # no install: 205 checks across every shape, base type and size preset
npm install && npm run test:ui # serves the folder like GitHub Pages and runs the customer flow in jsdom
```

jsdom has no WebGL or real canvas, so check the 3D view and the PNG artwork in a real browser.

## Licences

Third-party components and their licences are listed in `THIRD_PARTY_NOTICES.md`. Add your own licence for this project's
code before sharing it publicly.
