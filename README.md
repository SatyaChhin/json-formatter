# NPCA JSON & SQL Formatter

A browser-based tool built for **NPCA – National Payment Certification Agency** to format, validate,
explore, convert and share **JSON** and **SQL**. Everything runs client-side: no backend, and no data
leaves your machine.

Built with Nuxt 3 + TypeScript.

---

## Table of contents

- [Features](#features)
  - [Header & navigation](#header--navigation)
  - [JSON formatter](#json-formatter)
  - [View modes](#view-modes)
  - [Search & filter](#search--filter)
  - [JSON Card (image export)](#json-card-image-export)
  - [Compare (diff mode)](#compare-diff-mode)
  - [History & sharing](#history--sharing)
  - [SQL formatter](#sql-formatter)
  - [Copy menu](#copy-menu)
  - [Download with rename](#download-with-rename)
  - [Appearance](#appearance)
  - [Language](#language)
  - [Saved automatically](#saved-automatically)
- [Stack](#stack)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Notes for developers](#notes-for-developers)

---

## Features

### Header & navigation

| Feature | Description |
|---|---|
| **NPCA branding** | NPCA logo (`public/npca_logo.png`), agency name, and the current tool name. The logo is also the browser tab icon. |
| **JSON / SQL switch** | Toggles between the JSON workspace and the SQL formatter. The last tool used is remembered. |
| **Live status** | Shows **Valid JSON** / **Invalid JSON** while you type (JSON mode). |
| **Help menu** (`?`) | In-app list of every feature, grouped by category, in English or Khmer. |
| **Fullscreen** | From the **More** (`…`) menu. |

### JSON formatter

| Feature | Description |
|---|---|
| **Monaco editor** | Full code editor (the engine behind VS Code) with JSON syntax highlighting. |
| **Live validation** | Syntax errors appear in a banner with the **line and column** of the problem. |
| **Format** | Pretty-prints the JSON. |
| **Minify** | Collapses the JSON onto a single line. |
| **Indent size** | 2 or 4 spaces (**Transform** menu). |
| **Sort keys** | Sorts object keys alphabetically, at every depth. |
| **Escape / Unescape** | Wraps the document as a quoted string literal, or unwraps JSON that was pasted from inside a string (e.g. a log line). |
| **Upload file** | Load a `.json` / `.txt` file with the **Upload File** button or by dragging and dropping it onto the editor. |
| **Load sample** | Built-in sample datasets: User profile, API response (paginated), App config. |
| **Clear all** | Empties the editor. |
| **Resizable panels** | Drag the divider between the editor and the view panel. The view panel can be hidden with **Tree view**. |

### View modes

The right-hand panel shows the current document in one of eight views:

| View | Description |
|---|---|
| **Tree** | Expandable/collapsible tree. Hover a row to **copy its path** (e.g. `$.items[0].name`). |
| **Text** | The formatted JSON as plain text. |
| **Table** | Arrays of objects shown as a table. |
| **Code** | Read-only formatted JSON with syntax highlighting. |
| **Yaml** | The document converted to YAML. |
| **Csv** | Arrays of objects converted to CSV. |
| **Schema** | Validates the document against a JSON Schema you paste (powered by Ajv), listing every error. |
| **Card** | Turns the JSON into a styled image. See [JSON Card](#json-card-image-export). |

Every view has **Copy** (with [copy menu](#copy-menu)), **Download** and **Clear panel** buttons. Copy and
download follow the active view, so Yaml downloads `.yaml` and Csv downloads `.csv`.

### Search & filter

| Feature | Description |
|---|---|
| **Find field** | Filters the Tree, Text, Table, Code and Yaml views down to keys/values matching your text, keeping the parent structure. |
| **JMESPath query** | Filters or reshapes the document with a [JMESPath](https://jmespath.org) expression, e.g. `medical_histories[*].value[]`. Invalid expressions show an error. |

### JSON Card (image export)

Create a shareable picture of your JSON, for chats, docs or slides.

| Feature | Description |
|---|---|
| **Templates** | Classic, macOS Dark, macOS Light, Terminal, Minimal, Midnight, Sunset, Ocean. |
| **Gradient backdrop** | Optional colored background around the card. |
| **Colors** | Header, header text, body and body text: pick from presets, a color picker, or a hex code. **Reset to template** restores the defaults. |
| **Editable title & body** | Type directly on the card. |
| **Header icon** | Search and pick from the full Lucide icon set (icon-style templates). |
| **Copy image** | Copies the card to the clipboard as a PNG. |
| **Download PNG** | Saves the card as a high-resolution (2×) PNG. |

### Compare (diff mode)

| Feature | Description |
|---|---|
| **Side-by-side diff** | Compares the current document (left) against a second document (right), highlighting changes. |
| **Upload right side** | Load the comparison document from a file. |
| **Format right side** | Pretty-prints the comparison document so formatting differences don't hide real changes. |

### History & sharing

| Feature | Description |
|---|---|
| **Save to history** | Bookmarks a snapshot of the current document (up to 15, stored in your browser). |
| **Restore / remove** | Open the **History** menu to reload or delete a saved snapshot, or clear them all. |
| **Copy shareable link** | Compresses the document (gzip) into the URL and copies the link. Opening the link loads the document. Nothing is uploaded to a server. |

### SQL formatter

Switch the header to **SQL** to open it.

| Feature | Description |
|---|---|
| **Live formatting** | Paste SQL on the left; the formatted result updates on the right as you type. |
| **Format / Minify** | Pretty-print the query, or collapse it onto one line. Minify keeps string literals intact and turns `-- comments` into `/* comments */` so they don't break the query. |
| **Dialects** | Standard SQL, PostgreSQL, MySQL, MariaDB, SQL Server (T-SQL), Oracle PL/SQL, SQLite, BigQuery, Snowflake, Redshift, DB2, Hive, Spark, Trino / Presto, ClickHouse, DuckDB. |
| **Keyword case** | `UPPER`, `lower`, or keep as written. |
| **Indent** | 2 spaces, 4 spaces, or tabs. |
| **Syntax errors** | If a query can't be parsed, the error message is shown above the output. |
| **Replace input** | Moves the formatted result back into the input editor. |
| **Upload file** | Load a `.sql` / `.txt` file by button or drag and drop. |
| **Copy / Download / Clear all** | Download saves `query.sql` (or `query.min.sql` when minified). |

Powered by [`sql-formatter`](https://github.com/sql-formatter-org/sql-formatter).

### Copy menu

Every **Copy** button opens a dropdown so the text pastes nicely wherever it's going:

| Option | What gets copied |
|---|---|
| **Copy** | The text as-is. |
| **Copy minified** | One-line version (JSON and SQL). |
| **Telegram** | A ` ```json ` code block that Telegram renders as formatted code. Warns if the text is over Telegram's 4,096-character message limit. |
| **Discord / GitHub (Markdown)** | Code block with a language tag, for syntax highlighting. |
| **Slack** | Code block without a language tag (Slack would show the tag as text). |
| **Email / Word** | Rich text that keeps the monospace font and a code box when pasted into email, Word or Google Docs. |
| **Escaped string** | Quoted string literal, ready to paste into source code. |

### Download with rename

Every download (JSON, YAML, CSV, SQL, Card PNG) opens a **Download file** popup first:

- The suggested name is pre-selected; type a new one and press **Enter**.
- The extension (`.json`, `.yaml`, `.csv`, `.sql`, `.png`) is locked so the file type stays correct.
- Characters that aren't allowed in file names are removed automatically.
- **Esc**, **Cancel** or clicking outside closes the popup without downloading.

### Appearance

Open the flower icon in the header.

| Setting | Options |
|---|---|
| **Mode** | Dark / Light. Follows your OS setting on first visit. |
| **Theme** | Ledger, Terminal, Signal, Ember (UI accent and neutral colors). |
| **Code color** | Classic, Ocean, Sunset, Mono (JSON/SQL syntax colors, independent of the theme). |
| **Font** | IBM Plex Mono, JetBrains Mono, Fira Code, Source Code Pro, Roboto Mono. |
| **Font size** | 11–20 px, applied to the editors and all views. |

### Language

**EN / KM** switch in the header: the whole interface is available in **English** and **Khmer**
(rendered in Noto Sans Khmer).

### Saved automatically

Stored in your browser's `localStorage`, so they survive a page reload:

- JSON editor content, and SQL input with its dialect/case/indent options
- Last tool used (JSON or SQL)
- Theme, mode, code color, font, font size and language
- History snapshots

---

## Stack

- [Nuxt 3](https://nuxt.com) (Vue 3 Composition API, `<script setup lang="ts">`)
- TypeScript, strict mode
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) via `@monaco-editor/loader`, client-only
- Tailwind CSS
- `lucide-vue-next` icons
- `sql-formatter`: SQL formatting
- `ajv`: JSON Schema validation
- `jmespath`: JMESPath queries
- `js-yaml`: YAML conversion
- `html2canvas`: Card image export

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run generate` | Static site generation |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | `vue-tsc` type checking |

## Project structure

```
app.vue                     Root layout: header, JSON/SQL switch, JSON workspace, dialogs, toasts
public/
  npca_logo.png             NPCA logo (header + favicon)
components/
  JsonEditor.vue            Monaco wrapper (JSON or SQL), theme/font/code-color aware
  Toolbar.vue               JSON toolbar: format, minify, transform, sample, copy, download, clear
  TreeViewer.vue            Recursive expandable/collapsible JSON tree
  ErrorBanner.vue           Syntax error with line/column
  SchemaPanel.vue           JSON Schema validation view
  DiffViewer.vue            Monaco side-by-side diff editor
  JsonCard.vue              Card view: templates, colors, icons, PNG export
  SqlFormatter.vue          SQL formatter screen (toolbar + input/output editors)
  CopyMenu.vue              Copy dropdown (Telegram, Markdown, Slack, Email, …)
  DownloadDialog.vue        "Download file" rename popup
  Logo.vue                  Fallback logo mark (shown if the NPCA logo is missing)
composables/
  useJsonFormatter.ts       Validate / format / minify state
  useClipboard.ts           Clipboard (plain + rich HTML), downloads, shared toasts
  useDownloadDialog.ts      Promise-based filename prompt used by every download
  useHistory.ts             Saved snapshots (max 15)
  usePopover.ts             Dropdown open/close, outside-click and Escape handling
  useLocale.ts              EN/KM language state and translation lookup
  useTheme.ts               Dark/light mode and theme preset
  useCodeColorScheme.ts     Syntax color scheme
  useFontSettings.ts        Editor font family and size
locales/
  en.ts                     English strings (source of truth for translation keys)
  km.ts                     Khmer strings (type-checked against en.ts)
types/
  json.ts                   Shared JSON/editor types
  i18n.ts                   Locale, theme, font and color-scheme options
utils/
  sql.ts                    SQL dialect list, format and minify helpers
  copyFormats.ts            Copy menu transforms
  convert.ts                JSON → YAML / CSV
  schema.ts                 Ajv JSON Schema validation
  share.ts                  Gzip + base64url share-link encoding
  features.ts               Feature catalogue for the Help menu
  sampleData.ts             "Load sample" datasets
```

## Notes for developers

- **Client-side only:** all formatting, validation and conversion run in the browser.
- **Monaco and SSR:** Monaco depends on `window`/`document`, so every editor is rendered inside `<ClientOnly>`.
- **Theming:** colors are CSS variables in `assets/css/main.css`, toggled by a `.light` class and a `data-preset` attribute on `<html>`, so Tailwind classes like `bg-ink` and `text-parchment` resolve per theme. Monaco can't read CSS variables, so `JsonEditor.vue` defines matching Monaco themes (JSON and SQL token rules) and swaps them.
- **Translations:** `locales/km.ts` uses `satisfies Record<TranslationKey, string>`, so a missing Khmer key is a type error, not a silent fallback. Add new keys to `en.ts` first.
- **Shared state:** shared state (locale, theme, toasts, download dialog) uses Nuxt's `useState` rather than module-level refs, so it doesn't leak across requests during SSR.
- **Help menu:** when adding a feature, add its label/description keys to both locales and an entry in `utils/features.ts` so it appears in the Help menu.
- **Downloads:** go through `useClipboard().downloadJson()` (or `useDownloadDialog().requestFilename()` for non-text files), so the rename popup applies everywhere.
