// composables/useTheme.ts
import type { Theme } from '~/types/i18n'

const STORAGE_KEY = 'json-formatter:theme'

export function useTheme() {
  const theme = useState<Theme>('theme', () => 'dark')

  function applyToDocument(next: Theme) {
    if (!import.meta.client) return
    document.documentElement.classList.toggle('light', next === 'light')
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  function setTheme(next: Theme) {
    theme.value = next
    applyToDocument(next)
    if (import.meta.client) localStorage.setItem(STORAGE_KEY, next)
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  /** Call once on client mount: restores saved preference, else follows the OS setting */
  function initTheme() {
    if (!import.meta.client) return
    const saved = localStorage.getItem(STORAGE_KEY)
    const preferred: Theme =
      saved === 'light' || saved === 'dark'
        ? saved
        : window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark'
    theme.value = preferred
    applyToDocument(preferred)
  }

  return { theme, setTheme, toggleTheme, initTheme }
}
