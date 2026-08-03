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
