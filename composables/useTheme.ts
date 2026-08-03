// composables/useTheme.ts
import type { Theme, ThemePreset } from '~/types/i18n'

const STORAGE_KEY = 'json-formatter:theme'
const PRESET_STORAGE_KEY = 'json-formatter:theme-preset'
const VALID_PRESETS: ThemePreset[] = ['ledger', 'terminal', 'signal', 'ember']

export function useTheme() {
  const theme = useState<Theme>('theme', () => 'dark')
  const preset = useState<ThemePreset>('theme-preset', () => 'ledger')

  function applyToDocument(next: Theme) {
    if (!import.meta.client) return
    document.documentElement.classList.toggle('light', next === 'light')
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  function applyPreset(next: ThemePreset) {
    if (!import.meta.client) return
    document.documentElement.setAttribute('data-preset', next)
  }

  function setTheme(next: Theme) {
    theme.value = next
    applyToDocument(next)
    if (import.meta.client) localStorage.setItem(STORAGE_KEY, next)
  }

  function setPreset(next: ThemePreset) {
    preset.value = next
    applyPreset(next)
    if (import.meta.client) localStorage.setItem(PRESET_STORAGE_KEY, next)
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

    const savedPreset = localStorage.getItem(PRESET_STORAGE_KEY)
    const preferredPreset: ThemePreset = VALID_PRESETS.includes(savedPreset as ThemePreset)
      ? (savedPreset as ThemePreset)
      : 'ledger'
    preset.value = preferredPreset
    applyPreset(preferredPreset)
  }

  return { theme, preset, setTheme, setPreset, toggleTheme, initTheme }
}
