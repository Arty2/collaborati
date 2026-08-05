# /detrita

A local-first kanban board. No account, no server — your data stays in the browser.

- Project page: [heracl.es/detrita](https://heracl.es/detrita)
- Demo: [detrita.vercel.app](https://detrita.vercel.app/)
- Source: [github.com/arty2/detrita](https://github.com/arty2/detrita)
- Current version: 0.82 (2026-07-27)

## Mental model

Stages (columns) are shared across all swimlanes. Swimlanes are horizontal rows. Each cell (swimlane × stage) holds sorted cards. The Inbox is a virtual swimlane for unsorted cards.

## Etymology

*Detritus* is a learned borrowing from Latin **dētrītus**, "that which is rubbed away", from **dēterere**, "to wear down".

The Latin noun is fourth declension, so its plural is **dētrītūs** — spelled exactly like the singular. *Detrita* is what you get by declining it as though it were second-declension neuter, on the model of *datum* → *data*. Wiktionary marks the result a hypercorrection: a plural for things that were never supposed to accumulate.

It has two anagrams, and a board like this earns both: *attired* and *eat dirt*.

## Data

Saved locally in the browser (OPFS/IndexedDB). Export to Obsidian-compatible Markdown, CSV, or JSON. Sync to a local `.md` file (Chrome/Edge) via the Export / Import panel — works with Syncthing, Obsidian Sync, and Dropbox. Long-press the theme button for print preview.

### File sync

The `.md` file format is Obsidian Kanban–compatible: YAML frontmatter for board config (stages, swimlanes, colors), stages as `## Headings`, swimlanes as `### Sub-headings`, cards as `- [x]` list items with `#tags` `@mentions` `due:YYYY-MM-DD`, block IDs (`^cardId`) for stable identity across syncs, and card notes as indented continuation lines.

Auto-save interval: 1, 10, or 30 minutes. Polls for external changes and merges automatically.

### Cell editor

Long-press the + button in any cell to open a markdown editor for the entire cell. Existing cards appear as Obsidian-format list items. Edit, reorder, or paste markdown todos. Cards are matched by `^blockId` on save; new lines create new cards. Long-press the Inbox button to edit inbox cards the same way.

### Templates

Stage templates remap columns semantically: Kanban, Scrum, GTD, Sales, CRM, Content, Support.

## Keyboard shortcuts

| Key | Action |
|---|---|
| `↑` `↓` | Navigate cards within column |
| `←` `→` | Move focus to adjacent column |
| `Shift` `↑` `↓` | Select cards |
| `Tab` | Cycle: input → buttons → cards |
| `Page Down` `Page Up` | Next / previous swimlane |
| `Enter` | Open card detail panel |
| `e` | Inline edit focused card title |
| `n` | New card in focused column |
| `Delete` | Delete focused card |
| `Space` | Toggle done on focused card |
| `Esc` | Close panel or cancel |
| `/` or `Ctrl` `F` | Focus search |
| `i` | Toggle inbox panel |
| `?` or `F1` | Toggle help panel |
| `Alt` `↑` `↓` | Reorder card within column |
| `Alt` `←` `→` | Move card to adjacent column |
| `Ctrl` `Shift` `N` | Focus quick capture input |
| `Ctrl` `O` | Open Export / Import |
| `Ctrl` `S` | Export as Markdown |
| `Ctrl` `Shift` `S` | Copy board to clipboard |
| `Ctrl` `Shift` `O` | Paste board from clipboard |
| `Ctrl` `Z` | Undo |
| `Ctrl` `Shift` `Z` | Redo |

## Interactions

| Action | Effect |
|---|---|
| Double-click card | Toggle done / not done |
| Double-click stage | Rename stage |
| Double-click swimlane | Rename swimlane |
| Double-click cell | New card in that cell |
| Long-press + button | Edit cell as Markdown |
| Long-press Inbox | Edit inbox as Markdown |
| Drag card | Move across columns or swimlanes |
| Drag to brand | Delete card |
| Drag handle | Reorder swimlanes or stages |
| Shift + click card | Multi-select cards |
| Swipe right on panel | Close card detail panel |

## Filter syntax

| Prefix | Matches |
|---|---|
| `@name` | Assignee |
| `#label` | Label |
| `$task` `$meeting` `$followup` | Card type |
| `$overdue` `$done` | Status |
| (no prefix) | Title text |

## Architecture

Single-file HTML app (~281 KB, assembled from `src/`). Three-level keyed DOM reconciler with card signature memoization and RAF-coalesced renders. OPFS primary persistence, IndexedDB fallback, inline Web Worker for off-main-thread writes. File sync via File System Access API with SHA-256 change detection. Installable as a PWA (`manifest.webmanifest` + `icons/` served alongside the app, plus a service worker for offline use).

## Build & deploy

No framework and no runtime dependencies — the app is one static file. Sources live in `src/` (HTML shell, CSS split by `@layer`, JS split by section) and a zero-dependency Node script inlines them into the single `detrita.html`:

```sh
node build.js            # regenerate detrita.html + index.html   (npm run build)
node build.js --check    # fail if the committed output is stale
npm test                 # Playwright smoke tests
npm run test:integrity   # build-integrity checks (no browser)
```

The build writes two identical files: `detrita.html` (the portable, shareable single file, openable from `file://`) and `index.html` (so any static host serves the app at `/`). Edit `src/`, run `node build.js`, and commit both regenerated files with the source change. GitHub Actions builds, verifies the committed output is current, and runs the tests on every push. See [CLAUDE.md](CLAUDE.md) for the source layout and conventions.

The PWA manifest (`manifest.webmanifest`) and its icons (`icons/`) are committed static files served next to the app. Regenerate the icons from the brand mark with `npm run gen:icons` (uses the Playwright browser; only needed when the mark or its colors change).

Hosting is static — nothing to build on the host. `index.html` at the root makes `/` serve the app on any static host. On Vercel, `vercel.json` turns the build off and serves the committed repo root with the right manifest/icon headers; `_redirects` covers Netlify/Cloudflare Pages.

## Browser support

Chrome 117+, Safari 17.5+, Firefox 129+. File sync: Chrome/Edge only.

## License

Dialectic Acheiropoieton of [Heracles Papatheodorou](https://heracl.es) and Claude, MIT License
