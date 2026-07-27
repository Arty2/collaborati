# CLAUDE.md

Guidance for AI agents (and humans) working in this repo.

## What this is

`/collaborati` is a **local-first, single-file kanban board**. The whole app ships as one
static file, `collaborati.html` — no framework, no runtime dependencies, no server. Data
lives in the browser (OPFS with an IndexedDB fallback) and can sync to a local `.md` file.

## Source layout — edit `src/`, never `collaborati.html`

`collaborati.html` is **generated**. Do not hand-edit it; your change would be overwritten by
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
collaborati.html        # GENERATED, committed (kept in git so it stays openable/portable).
```

The build is **pure concatenation**: the JS stays one global scope exactly as before, so
moving code between `src/app/*.js` files is safe as long as ordering is preserved. There is
no bundler and no ES-module system — don't add `import`/`export`.

## Build & test

```sh
npm ci            # once, installs @playwright/test
node build.js     # regenerate collaborati.html  (npm run build)
node build.js --check   # fail if the committed file is stale  (npm run check)
npm run test:integrity  # node --test, no browser
npm test          # Playwright smoke tests (serves the repo, drives collaborati.html)
```

In this sandbox the browser is preinstalled; point Playwright at it:
`PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npm test`. In GitHub Actions CI, the browser is
installed with `npx playwright install --with-deps chromium` (see `.github/workflows/ci.yml`),
which also runs the build, verifies `collaborati.html` isn't stale, and runs both test suites.

**Workflow for any change:** edit `src/` → `node build.js` → run tests → commit **both** the
`src/` change and the regenerated `collaborati.html`.

## Conventions

- **Version** lives in two spots — bump both together: `src/index.html` (help panel:
  "Current version: X.Y (YYYY-MM-DD)") and `README.md`. `package.json` `version` too.
- **Service worker cache** name is `const CACHE = 'collaborati-vN'` in
  `src/app/08-service-worker.js`. Bump `N` whenever you ship HTML changes so returning
  offline/PWA users pick up the new build.
- **Stay inline / single-file.** The favicon, service worker, and web app manifest are all
  inlined (data URIs / blob) so the built file remains self-contained and openable from
  `file://`. Keep it that way. PWA icons are rasterized from the brand `<path>` in
  `src/index.html`.
- File-sync features use the File System Access API and need `http(s)://` (they're disabled on
  `file://`).

## Deploy

Static hosting, no build required by the host. On **Vercel** the committed `collaborati.html`
is served and `vercel.json` rewrites `/` → `/collaborati.html` (fixes the root 404;
`cleanUrls` also makes `/collaborati` resolve). `_redirects` covers Netlify/Cloudflare Pages,
which Vercel ignores. Repo: https://github.com/arty2/collaborati.
