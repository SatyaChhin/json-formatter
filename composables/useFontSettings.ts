// composables/useFontSettings.ts
import { computed } from 'vue'
import { FONT_SIZE_DEFAULT, FONT_SIZE_MAX, FONT_SIZE_MIN, fontFamilyOptions, type FontFamily } from '~/types/i18n'

const FAMILY_STORAGE_KEY = 'json-formatter:font-family'
const SIZE_STORAGE_KEY = 'json-formatter:font-size'
const VALID_FAMILIES: FontFamily[] = fontFamilyOptions.map((opt) => opt.id)
const DEFAULT_FAMILY: FontFamily = 'plex-mono'

function stackFor(family: FontFamily): string {
  return fontFamilyOptions.find((opt) => opt.id === family)?.stack ?? stackFor(DEFAULT_FAMILY)
}

function clampSize(size: number): number {
  return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, size))
}

/**
 * App-wide font family + size. Applied via CSS variables on <html>
 * (--font-mono-active, --font-size-content) so both Tailwind's font-mono
 * utility and the Monaco editor (which reads the same var through an
 * inline style) stay in sync with one source of truth.
 */
export function useFontSettings() {
  const fontFamily = useState<FontFamily>('font-family', () => DEFAULT_FAMILY)
  const fontSize = useState<number>('font-size', () => FONT_SIZE_DEFAULT)
  /** Resolved CSS font-family stack for the current selection — hand this
   *  to Monaco directly (rather than the CSS var) so it re-measures glyph
   *  widths whenever the value actually changes. */
  const fontFamilyStack = computed(() => stackFor(fontFamily.value))

  function applyFontFamily(next: FontFamily) {
    if (!import.meta.client) return
    document.documentElement.style.setProperty('--font-mono-active', stackFor(next))
  }

  function applyFontSize(next: number) {
    if (!import.meta.client) return
    document.documentElement.style.setProperty('--font-size-content', `${next}px`)
  }

  function setFontFamily(next: FontFamily) {
    fontFamily.value = next
    applyFontFamily(next)
    if (import.meta.client) localStorage.setItem(FAMILY_STORAGE_KEY, next)
  }

  function setFontSize(next: number) {
    const clamped = clampSize(next)
    fontSize.value = clamped
    applyFontSize(clamped)
    if (import.meta.client) localStorage.setItem(SIZE_STORAGE_KEY, String(clamped))
  }

  /** Call once on client mount: restores saved preferences, else the defaults */
  function initFontSettings() {
    if (!import.meta.client) return

    const savedFamily = localStorage.getItem(FAMILY_STORAGE_KEY)
    const preferredFamily: FontFamily = VALID_FAMILIES.includes(savedFamily as FontFamily)
      ? (savedFamily as FontFamily)
      : DEFAULT_FAMILY
    fontFamily.value = preferredFamily
    applyFontFamily(preferredFamily)

    const savedSize = Number(localStorage.getItem(SIZE_STORAGE_KEY))
    const preferredSize = Number.isFinite(savedSize) && savedSize > 0 ? clampSize(savedSize) : FONT_SIZE_DEFAULT
    fontSize.value = preferredSize
    applyFontSize(preferredSize)
  }

  return { fontFamily, fontFamilyStack, fontSize, setFontFamily, setFontSize, initFontSettings }
}
