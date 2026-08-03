// types/i18n.ts

/** Supported UI languages */
export type Locale = 'en' | 'km'

/** Supported color schemes */
export type Theme = 'light' | 'dark'

/** Named accent/neutral palettes — each still has its own light + dark variant */
export type ThemePreset = 'ledger' | 'terminal' | 'signal' | 'ember'

export interface LocaleOption {
  code: Locale
  label: string
  nativeLabel: string
}

export const localeOptions: LocaleOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'km', label: 'Khmer', nativeLabel: 'ខ្មែរ' },
]

export interface ThemePresetOption {
  id: ThemePreset
  label: string
  /** Representative accent swatch, dark-mode hex — shown as a dot in the picker */
  swatch: string
}

export const themePresetOptions: ThemePresetOption[] = [
  { id: 'ledger', label: 'Ledger', swatch: '#E8A33D' },
  { id: 'terminal', label: 'Terminal', swatch: '#4ADE80' },
  { id: 'signal', label: 'Signal', swatch: '#5B9DF5' },
  { id: 'ember', label: 'Ember', swatch: '#F26B4D' },
]

/** Selectable monospace faces — used for editor + all JSON display panels */
export type FontFamily = 'plex-mono' | 'jetbrains-mono' | 'fira-code' | 'source-code-pro' | 'roboto-mono'

export interface FontFamilyOption {
  id: FontFamily
  label: string
  /** Full CSS font-family stack, written into --font-mono-active */
  stack: string
}

export const fontFamilyOptions: FontFamilyOption[] = [
  { id: 'plex-mono', label: 'IBM Plex Mono', stack: '"IBM Plex Mono", ui-monospace, SFMono-Regular, monospace' },
  { id: 'jetbrains-mono', label: 'JetBrains Mono', stack: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace' },
  { id: 'fira-code', label: 'Fira Code', stack: '"Fira Code", ui-monospace, SFMono-Regular, monospace' },
  { id: 'source-code-pro', label: 'Source Code Pro', stack: '"Source Code Pro", ui-monospace, SFMono-Regular, monospace' },
  { id: 'roboto-mono', label: 'Roboto Mono', stack: '"Roboto Mono", ui-monospace, SFMono-Regular, monospace' },
]

export const FONT_SIZE_MIN = 11
export const FONT_SIZE_MAX = 20
export const FONT_SIZE_DEFAULT = 13
