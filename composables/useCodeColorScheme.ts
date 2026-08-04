// composables/useCodeColorScheme.ts
import { codeColorSchemeOptions, type CodeColorScheme } from '~/types/i18n'

const STORAGE_KEY = 'json-formatter:code-color-scheme'
const VALID_SCHEMES: CodeColorScheme[] = codeColorSchemeOptions.map((opt) => opt.id)
const DEFAULT_SCHEME: CodeColorScheme = 'classic'

/**
 * JSON syntax-highlight palette (string/number/boolean/key colors) — kept
 * separate from useTheme's `preset`, which only controls UI accent/neutrals.
 * Applied via [data-code-scheme] on <html> so both Tailwind (assets/css/main.css)
 * and Monaco (JsonEditor.vue) can read the same selection.
 */
export function useCodeColorScheme() {
  const codeColorScheme = useState<CodeColorScheme>('code-color-scheme', () => DEFAULT_SCHEME)

  function applyToDocument(next: CodeColorScheme) {
    if (!import.meta.client) return
    document.documentElement.setAttribute('data-code-scheme', next)
  }

  function setCodeColorScheme(next: CodeColorScheme) {
    codeColorScheme.value = next
    applyToDocument(next)
    if (import.meta.client) localStorage.setItem(STORAGE_KEY, next)
  }

  /** Call once on client mount: restores saved preference, else the default */
  function initCodeColorScheme() {
    if (!import.meta.client) return
    const saved = localStorage.getItem(STORAGE_KEY)
    const preferred: CodeColorScheme = VALID_SCHEMES.includes(saved as CodeColorScheme)
      ? (saved as CodeColorScheme)
      : DEFAULT_SCHEME
    codeColorScheme.value = preferred
    applyToDocument(preferred)
  }

  return { codeColorScheme, setCodeColorScheme, initCodeColorScheme }
}
