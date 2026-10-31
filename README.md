# Cascade Workspace

**Cascade Workspace** is a local-first Windows desktop productivity application built with **Electron**, **Vite**, **React 18**, **TypeScript**, and **TailwindCSS**. It combines rich Markdown documents (`.md`), a vector presentation studio (`.deck`), native SQLite database tables (`.db` / `.sqlite`), and an optional local Ollama AI assistant inside an Obsidian-inspired dark purple interface (`#1E1E1E` / `#161616` / `#2A1B3D` / `#4A2574` / `#7E42C1`).

---

## 1. Project Overview & Core Capabilities

- **Markdown Notes & Documents (`.md`):**
  - Split-pane, live-preview, and reading modes with an accessible icon-based formatting toolbar.
  - Inline (`$...$`) and block (`$$...$$`) LaTeX mathematical rendering via `katex` with symbolic typographic fallback.
  - Fenced ````mermaid```` diagram rendering (`flowchart` / `graph` topologies).
  - Interactive SVG mathematical function grapher (````mathgraph```` blocks) supporting multi-function plotting (`f(x)`), domain zooming, and `requestAnimationFrame`-throttled coordinate crosshairs.
  - Print page break support (`---pagebreak---`).
- **Presentation Studio (`.deck`):**
  - Native JSON-backed `.deck` presentation format with `16:9` and `4:3` aspect ratios, slide transitions (`none`, `fade`, `slide`, `zoom`), speaker notes, and fullscreen Presenter View.
  - Categorized **31-shape vector library** (`geometric`, `arrows`, `callouts`, `flowchart`) with an icon-only Quick Shape palette and searchable `ShapeLibraryPopover`.
  - 60fps local drag and 8-handle resize, `ResizeObserver` responsive canvas scaling, multi-object selection (`Shift+Click`), object grouping (`Ctrl+G` / `Ctrl+Shift+G`), alignment & distribution, and Z-order layer arrangement.
  - Focus-aware presentation keyboard shortcuts (`Delete`/`Backspace`, `Ctrl+Z`, `Ctrl+Y`/`Ctrl+Shift+Z`, `Ctrl+C`, `Ctrl+V`, `Ctrl+D`, `Ctrl+A`, `Escape`, and arrow-key nudging) that never intercept keystrokes while typing in text inputs or editing text inline inside shapes.
- **SQLite Database Workspace (`.db` / `.sqlite`):**
  - Native SQLite table management and query execution in the Electron Main process (`SqliteService`) with WAL journaling and an automatic CLI/in-memory fallback when native `better-sqlite3` bindings are absent.
  - Visual data grid with sorting, filtering, inline cell editing, row insertion/deletion, schema column operations (`ADD`, `RENAME`, `DROP`), and a raw SQL query console.
- **Local Ollama AI Assistant:**
  - Connects to a local Ollama HTTP daemon (`http://localhost:11434` by default) and discovers installed models via `/api/tags`.
  - Enforces a **Strict Context Boundary**: queries only the active tab/selection unless **"Allow AI to search entire workspace"** is explicitly enabled.
  - Displays clickable `Source: [filename]` citation badges and gates all proposed file, slide, or SQL mutations behind user-approved **Proposed Action Preview Cards** (`[✓ Approve & Apply]` / `[✕ Reject]`).
- **Native PDF Export (`webContents.printToPDF`):**
  - Exports Markdown notes, SQLite tables (full table or active query selection), and `.deck` presentations (entire deck or selected slides, with optional speaker notes) in either **Obsidian Dark (`#1E1E1E`)** or **Print Crisp Light (`#FFFFFF`)** themes.

---

## 2. Prerequisites

- **Operating System:** Windows 10 / 11 (x64) for desktop packaging (`electron-builder --win --x64`); also runs in development/test mode on macOS and Linux.
- **Node.js:** Node.js `>= 18.x` (LTS recommended) and `npm`.
- **SQLite Native Addon (Optional):** `better-sqlite3` is listed under `optionalDependencies`. If Windows C++ build tools (`Visual Studio Build Tools` with the "Desktop development with C++" workload) are installed, `better-sqlite3` compiles native bindings automatically; otherwise, `SqliteService` falls back seamlessly without blocking `npm install`.
- **Local AI (Optional):** [Ollama](https://ollama.com) running locally on `http://localhost:11434` (e.g., `ollama run llama3.1:8b` or `ollama run qwen2.5-coder:7b`). The application remains fully functional offline if Ollama is not running.

---

## 3. Installation & Setup

1. Clone the repository and navigate into the project directory:
   ```bash
   git clone <your-repo-url>
   cd cascade-workspace
   ```
2. Install project dependencies:
   ```bash
   npm install
   ```
3. Run the verification and unit test suite:
   ```bash
   npm test
   ```
4. Start the Electron + Vite development environment:
   ```bash
   npm run dev
   ```

---

## 4. Available Scripts & Commands

All scripts defined in `package.json`:

| Command | Script Definition | Description |
| :--- | :--- | :--- |
| `npm run dev` | `electron-vite dev` | Launches the Electron desktop app with Vite hot-module reloading for the React renderer. |
| `npm run build` | `npm run typecheck && electron-vite build` | Runs TypeScript typechecking followed by production bundling of `main`, `preload`, and `renderer` into `out/`. |
| `npm run preview` | `electron-vite preview` | Previews the production Electron build locally from `out/`. |
| `npm run typecheck` | `tsc --noEmit` | Runs the TypeScript compiler across `src/` and `tests/` without emitting files. |
| `npm test` | `node scripts/verify-stage3.js` | Verifies TypeScript/JSX compilation across all modules and runs all 4 automated test suites (`sqlite-service`, `deck-schema`, `fs-service`, and `deck-keyboard-shapes`). |
| `npm run package:win` | `npm run build && electron-builder --win --x64` | Builds the application and packages a 64-bit Windows desktop distribution via `electron-builder`. |

---

## 5. Configuration Guidance

Click the **Settings (Gear)** icon at the bottom of the left Activity Ribbon to configure preferences across six categories:

1. **Workspace & Files:** Switch the active local workspace directory (`~/CascadeWorkspace` in Electron main process or `./workspace` default), configure the relative media assets folder (`assets`), and adjust the auto-save interval (`3000ms` default).
2. **Editor & Appearance:** Choose the default Markdown view mode (`split`, `live`, or `reading`), editor font size (`15px` default), line height, and spellcheck.
3. **SQLite & Tables:** Configure the default grid page row limit (`100`) and custom `NULL` badge text.
4. **Presentations:** Set the default slide aspect ratio (`16:9` or `4:3`), default slide transition, and speaker notes visibility.
5. **Ollama & AI:** Configure the local Ollama base URL (`http://localhost:11434`), select an installed model, and toggle **"Allow AI to search entire workspace"** (off by default to enforce the single-tab context boundary).
6. **PDF Export:** Set the default export theme (`dark` vs. `print-light`) and paper size (`A4` or `Letter`).

---

## 6. Usage Notes

- **Workspace Subdirectories & Media Assets:** When a local workspace directory is opened, `FsService` automatically ensures `notes/`, `presentations/`, `databases/`, and `assets/` subdirectories exist. Any image embedded into a `.md` note or `.deck` slide via the toolbar is copied into `<workspace>/assets/` and referenced via a portable relative path (`assets/<filename>`).
- **Presentation Keyboard Shortcuts:** Click the slide canvas or any slide object to focus the presentation stage (`Canvas Focused` pill indicator). Use `Delete` / `Backspace` to remove selected objects, `Ctrl+Z` / `Ctrl+Y` (`Ctrl+Shift+Z`) for undo/redo, `Ctrl+C` / `Ctrl+V` for copy/paste, `Ctrl+D` to duplicate, `Ctrl+G` / `Ctrl+Shift+G` to group/ungroup, and arrow keys (`Shift+Arrow` for `10px` steps) to nudge objects. Double-click any text box or shape to edit its text inline.
- **Resizable Panels:** Drag the vertical splitter handles on the inner edges of the **File Explorer** (`180px–440px`) and **Ollama AI Assistant** (`260px–520px`) sidebars, or collapse them via the `«` / `»` controls; the central editor and presentation stage automatically adapt to fill the remaining space.

---

## License

MIT
