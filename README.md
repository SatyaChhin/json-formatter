# JSON Formatter (Nuxt 3 + TypeScript)

A client-side clone of the core JSONFormatter.org workflow: format, minify,
validate, and explore JSON — entirely in the browser, no backend.

## Stack

- Nuxt 3 (Vue 3 Composition API, `<script setup lang="ts">`)
- TypeScript, strict mode
- Monaco Editor (`@monaco-editor/loader`), loaded client-only
- Tailwind CSS
- `lucide-vue-next` icons

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run generate` — static site generation
- `npm run typecheck` — `vue-tsc` type checking

## Project structure

```
app.vue                        Root layout: header, toolbar, editor + tree panels, toasts
components/
  Logo.vue                      System logo mark (braces + token-colored dots)
  JsonEditor.vue                Monaco wrapper, client-only, light/dark theme
  Toolbar.vue                   Format/minify/copy/download/clear/sample/tree controls
  TreeViewer.vue                Recursive expandable/collapsible JSON tree
  ErrorBanner.vue                Syntax error display with line/column
composables/
  useJsonFormatter.ts           Validate/format/minify state machine
  useClipboard.ts                Clipboard + download + toast notifications
  useLocale.ts                   EN/KM language state, translation lookup, persistence
  useTheme.ts                    Light/dark theme state, persistence, OS preference
locales/
  en.ts                          English strings (source of truth for translation keys)
  km.ts                          Khmer strings (type-checked against en.ts)
types/json.ts                   Shared TypeScript interfaces
types/i18n.ts                   Locale/Theme types
utils/sampleData.ts             "Load sample" mock datasets
```

## Features added

- **Dark / light mode** — toggle in the header (sun/moon icon). Persisted to
  `localStorage`, falls back to the OS `prefers-color-scheme` on first visit.
  Implemented via CSS variables in `assets/css/main.css` + a `.light` class
  on `<html>`, so the same Tailwind class names (`bg-ink`, `text-parchment`,
  etc.) resolve to different values per theme. Monaco doesn't read CSS
  variables, so `JsonEditor.vue` defines and swaps a matching pair of Monaco
  themes independently.
- **English / Khmer (KH) language switch** — `EN`/`KM` toggle in the header.
  `locales/km.ts` is type-checked against `locales/en.ts` (`satisfies
  Record<TranslationKey, string>`), so a missing translation key is a build
  error, not a silent fallback. Khmer text renders in Noto Sans Khmer,
  loaded alongside the Latin fonts.
- **System logo** — `components/Logo.vue`, a small hand-built SVG mark:
  curly braces in the app's indigo accent with three dots in the
  string/number/boolean colors between them, echoing JSON's own
  comma-separated values.

## Notes

- All formatting/validation runs client-side; no data leaves the browser.
- Monaco is rendered inside `<ClientOnly>` in `app.vue` to avoid SSR
  hydration errors, since it depends on `window`/`document`.
- The color system doubles as the JSON syntax-highlighting palette (keys,
  strings, numbers, booleans) and is reused across the UI — see
  `tailwind.config.ts`. Light-mode accent values are deepened versions of
  the dark-mode ones, tuned for contrast against a white background.
- `useLocale`/`useTheme` use Nuxt's `useState` rather than a plain module
  ref, so the shared reactive state doesn't leak across requests during SSR.
