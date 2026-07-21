// composables/useLocale.ts
import { en, type TranslationKey } from '~/locales/en'
import { km } from '~/locales/km'
import type { Locale } from '~/types/i18n'

const STORAGE_KEY = 'json-formatter:locale'

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { en, km }

/**
 * Shared app-wide locale state. Uses Nuxt's useState so the same reactive
 * value is shared across components without being leaked between requests
 * during SSR (unlike a plain module-level ref).
 */
export function useLocale() {
  const locale = useState<Locale>('locale', () => 'en')

  function t(key: TranslationKey, params?: Record<string, string>): string {
    const dict = dictionaries[locale.value]
    let text = dict[key] ?? en[key] ?? key
    if (params) {
      for (const [paramKey, value] of Object.entries(params)) {
        text = text.replace(`{${paramKey}}`, value)
      }
    }
    return text
  }

  function setLocale(next: Locale) {
    locale.value = next
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, next)
      document.documentElement.lang = next
    }
  }

  /** Call once on client mount to restore the saved language preference */
  function initLocale() {
    if (!import.meta.client) return
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'km') {
      locale.value = saved
    }
    document.documentElement.lang = locale.value
  }

  return { locale, t, setLocale, initLocale }
}
