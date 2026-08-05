# CLAUDE.md

Guidance for AI agents (and humans) working in this repo.

## What this is

`/detritus` is a **local-first, single-file kanban board**. The whole app ships as one
static file, `detritus.html` — no framework, no runtime dependencies, no server. Data
lives in the browser (OPFS with an IndexedDB fallback) and can sync to a local `.md` file.

## Source layout — edit `src/`, never `detritus.html`

`detritus.html` is **generated**. Do not hand-edit it; your change would be overwritten by
the next build (and CI fails if it's out of sync). Edit the sources under `src/` and rebuild:

```
src/
  index.html            # HTML shell: <head>, body markup, and two build markers:
                        #   /*__BUILD_STYLES__*/   and   //__BUILD_SCRIPTS__
  styles/*.css          # concatenated (filename order) into the <style> block.
                        #   Split by CSS @layer: 00-layers, 01-reset, 02-tokens,
                        #   03-layout, 04-components, 05-utilities.
  app/*.js              # concatenated (filename order) into the <script> block.
                        #   Split by top-level section: 00-core, 01-undo-redo,
                        #   02-stage-header, 03-swimlanes, 04-cells, 05-drag,
                        #   06-cell-editor, 07-modal-wiring, 08-service-worker, 09-boot.
build.js                # zero-dependency Node build (concatenate + inline).
detritus.html        # GENERATED, committed (kept in git so it stays openable/portable).
index.html              # GENERATED, committed — identical copy so static hosts serve "/".
```

The build is **pure concatenation**: the JS stays one global scope exactly as before, so
moving code between `src/app/*.js` files is safe as long as ordering is preserved. There is
no bundler and no ES-module system — don't add `import`/`export`.

## Build & test

```sh
npm ci            # once, installs @playwright/test
node build.js     # regenerate detritus.html  (npm run build)
node build.js --check   # fail if the committed file is stale  (npm run check)
npm run test:integrity  # node --test, no browser
npm test          # Playwright smoke tests (serves the repo, drives detritus.html)
```

In this sandbox the browser is preinstalled; point Playwright at it:
`PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npm test`. In GitHub Actions CI, the browser is
installed with `npx playwright install --with-deps chromium` (see `.github/workflows/ci.yml`),
which also runs the build, verifies `detritus.html` isn't stale, and runs both test suites.

**Workflow for any change:** edit `src/` → `node build.js` → run tests → commit **both** the
`src/` change and the regenerated `detritus.html`.

## Conventions

- **Version** lives in two spots — bump both together: `src/index.html` (help panel:
  "Current version: X.Y (YYYY-MM-DD)") and `README.md`. `package.json` `version` too.
- **Service worker cache** name is `const CACHE = 'detritus-vN'` in
  `src/app/08-service-worker.js`. Bump `N` whenever you ship HTML changes so returning
  offline/PWA users pick up the new build.
- **Stay inline where it counts.** The favicon and service worker are inlined (data URI /
  blob) so the built `detritus.html` stays self-contained and openable from `file://`.
  Keep those inline.
- **Manifest & icons are separate static files.** `manifest.webmanifest` and `icons/*.png`
  live at the repo root and are served next to `detritus.html` — a real manifest URL is
  what makes the PWA reliably installable (a `data:` manifest can't resolve `start_url`). The
  built file still opens from `file://`; the manifest just won't load there, which is fine.
  Regenerate icons from the brand `<path>` in `src/index.html` with `npm run gen:icons`
  (`tools/gen-icons.js`, uses the Playwright browser); icons are committed, so this isn't part
  of the build or deploy.
- File-sync features use the File System Access API and need `http(s)://` (they're disabled on
  `file://`).

## Deploy

Static hosting, no build required by the host. The build emits `index.html` (identical to
`detritus.html`), so `/` serves the app on any static host with no rewrite — this is the
primary fix for the root 404. On **Vercel**, `vercel.json` also turns the build off (no-op
`buildCommand`/`installCommand`, `outputDirectory: "."`) and serves the committed repo root —
otherwise Vercel sees `package.json`, runs `npm run build`, and then fails looking for a
`public/` output dir. `cleanUrls` makes `/detritus` resolve; the config serves
`/manifest.webmanifest` with the right `Content-Type` and long-caches `/icons/*`. A `/` →
`/detritus.html` rewrite is kept as a harmless fallback behind `index.html`. `.vercelignore`
keeps `src/`, `tests/`, and tooling out of the deploy. `_redirects` covers Netlify/Cloudflare
Pages, which Vercel ignores. Repo: https://github.com/arty2/collaborati.
