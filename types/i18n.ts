// types/i18n.ts

/** Supported UI languages */
export type Locale = 'en' | 'km'

/** Supported color schemes */
export type Theme = 'light' | 'dark'

export interface LocaleOption {
  code: Locale
  label: string
  nativeLabel: string
}

export const localeOptions: LocaleOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'km', label: 'Khmer', nativeLabel: 'ខ្មែរ' },
]
