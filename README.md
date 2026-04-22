# /collaborati

A local-first kanban board. No account, no server — your data stays in the browser.

- Live instance: [collaborati.online](https://collaborati.online)
- Project website: [heracl.es/collaborati](https://heracl.es/collaborati)
- Current version: 0.81 (2026-04-06)

## Mental model

Stages (columns) are shared across all swimlanes. Swimlanes are horizontal rows. Each cell (swimlane × stage) holds sorted cards. The Inbox is a virtual swimlane for unsorted cards.

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

Single-file HTML app (~275 KB). Three-level keyed DOM reconciler with card signature memoization and RAF-coalesced renders. OPFS primary persistence, IndexedDB fallback, inline Web Worker for off-main-thread writes. File sync via File System Access API with SHA-256 change detection.

## Browser support

Chrome 117+, Safari 17.5+, Firefox 129+. File sync: Chrome/Edge only.

## License

Dialectic Acheropoieton of [Heracles Papatheodorou](https://heracl.es), MIT License
