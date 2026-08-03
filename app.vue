<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, type Component } from 'vue'
import jmespath from 'jmespath'
import {
  CheckCircle2,
  XCircle,
  Flower,
  Sun,
  Moon,
  FolderTree,
  ArrowUpDown,
  Copy,
  Download,
  Trash2,
  Check,
  Code2,
  FileText,
  Table,
  Search,
  X,
  Code,
  Upload,
  Maximize2,
  Minimize2,
  FileType2,
  FileSpreadsheet,
  Share,
  ShieldCheck,
  Bookmark,
  History,
  Trash,
  GitCompare,
  WandSparkles,
  Ellipsis,
  Plus,
  Minus,
} from 'lucide-vue-next'
import { useJsonFormatter } from '~/composables/useJsonFormatter'
import { useClipboard } from '~/composables/useClipboard'
import { useLocale } from '~/composables/useLocale'
import { useTheme } from '~/composables/useTheme'
import { useFontSettings } from '~/composables/useFontSettings'
import { useHistory } from '~/composables/useHistory'
import { sampleDatasets } from '~/utils/sampleData'
import { jsonToYaml, rowsToCsv } from '~/utils/convert'
import { encodeShareHash, decodeShareHash } from '~/utils/share'
import { localeOptions, themePresetOptions, fontFamilyOptions, FONT_SIZE_MIN, FONT_SIZE_MAX } from '~/types/i18n'
import type { IndentSize, SampleDataset } from '~/types/json'
import type { Locale, FontFamily } from '~/types/i18n'

// View mode type definition
type ViewMode = 'tree' | 'text' | 'table' | 'code' | 'yaml' | 'csv' | 'schema'

const viewTabs: { id: ViewMode; label: string; icon: Component }[] = [
  { id: 'tree', label: 'Tree', icon: FolderTree },
  { id: 'text', label: 'Text', icon: FileText },
  { id: 'table', label: 'Table', icon: Table },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'yaml', label: 'Yaml', icon: FileType2 },
  { id: 'csv', label: 'Csv', icon: FileSpreadsheet },
  { id: 'schema', label: 'Schema', icon: ShieldCheck },
]

const { state, options, validate, format, minify, setIndentSize, toggleSortKeys, clear, loadSample, canDownload } =
  useJsonFormatter()
const { toasts, copyToClipboard, downloadJson, pushToast } = useClipboard()
const { locale, t, setLocale, initLocale } = useLocale()
const { theme, preset, setTheme, setPreset, initTheme } = useTheme()
const { fontFamily, fontSize, setFontFamily, setFontSize, initFontSettings } = useFontSettings()
const themeMenuOpen = ref(false)
const { entries: historyEntries, initHistory, save: saveHistory, remove: removeHistoryEntry, clear: clearHistory } = useHistory()

// Editor state content, view mode & search query
const content = ref('')
const showTree = ref(true)
const viewMode = ref<ViewMode>('tree') // Modes: 'tree', 'text', 'table', 'code'
const searchQuery = ref('')            // Search/Find field state
const jmesQuery = ref('')              // JMESPath Query State
const jmesError = ref<string | null>(null)
const isTreeCleared = ref(false)
const treeCopied = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const diffFileInputRef = ref<HTMLInputElement | null>(null)

// Fullscreen state
const isFullscreen = ref(false)

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`)
    })
  } else {
    document.exitFullscreen()
  }
}

function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

// Resizable panel states
const leftPanelWidth = ref<number>(50) // Default percentage width of the left panel
const isResizing = ref(false)

function startResize() {
  isResizing.value = true
  window.addEventListener('mousemove', onResize)
  window.addEventListener('mouseup', stopResize)
}

function onResize(event: MouseEvent) {
  if (!isResizing.value) return

  const totalWidth = window.innerWidth
  const newWidthPercent = (event.clientX / totalWidth) * 100

  // Clamp between 20% and 80% to prevent collapsing completely
  if (newWidthPercent >= 20 && newWidthPercent <= 80) {
    leftPanelWidth.value = newWidthPercent
  }
}

function stopResize() {
  isResizing.value = false
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', stopResize)
}

// Handle file upload for JSON formatting
function triggerFileUpload() {
  fileInputRef.value?.click()
}

function loadFile(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    if (text) {
      content.value = text
      if (format(text)) {
        content.value = state.value.formatted
      }
    }
  }
  reader.readAsText(file)
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) loadFile(file)
  // Reset file input value so the same file can be uploaded again if needed
  if (target) target.value = ''
}

const isDraggingFile = ref(false)
let dragDepth = 0

function handleDragEnter(event: DragEvent) {
  if (!event.dataTransfer?.types.includes('Files')) return
  dragDepth++
  isDraggingFile.value = true
}

function handleDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) isDraggingFile.value = false
}

function handleDrop(event: DragEvent) {
  dragDepth = 0
  isDraggingFile.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) loadFile(file)
}

// Live validation on every keystroke
const liveValidation = computed(() => validate(content.value))
const isEmpty = computed(() => content.value.trim() === '')

const parsedForTree = computed<unknown>(() => {
  if (!liveValidation.value.valid) return undefined
  return liveValidation.value.data
})

/**
 * Deep recursive filter that prunes non-matching properties while retaining
 * parent-child structural validity for Tree, Text, and Code views.
 */
function filterJsonDeep(data: unknown, query: string): unknown {
  if (!query) return data
  const q = query.toLowerCase()

  if (data === null || data === undefined) return undefined

  // Match primitive leaf values
  if (typeof data !== 'object') {
    return String(data).toLowerCase().includes(q) ? data : undefined
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    const filteredArr = data
      .map(item => filterJsonDeep(item, query))
      .filter(item => item !== undefined)
    return filteredArr.length > 0 ? filteredArr : undefined
  }

  // Handle Objects
  const resultObj: Record<string, unknown> = {}
  let matches = false

  for (const [key, val] of Object.entries(data)) {
    const keyMatches = key.toLowerCase().includes(q)
    const filteredVal = filterJsonDeep(val, query)

    // Keep field if the property key matches OR its nested value matches
    if (keyMatches || filteredVal !== undefined) {
      resultObj[key] = keyMatches ? val : filteredVal
      matches = true
    }
  }

  return matches ? resultObj : undefined
}

// Transform data using JMESPath or deep search
const filteredParsedData = computed(() => {
  if (!parsedForTree.value) return undefined
  jmesError.value = null

  // 1. Prioritize JMESPath Query execution if supplied
  if (jmesQuery.value.trim()) {
    try {
      const result = jmespath.search(parsedForTree.value, jmesQuery.value.trim())
      return result !== null ? result : undefined
    } catch (err: any) {
      jmesError.value = err?.message || 'Invalid JMESPath query'
      return undefined
    }
  }

  // 2. Fall back to standard search query if present
  if (!searchQuery.value.trim()) return parsedForTree.value
  return filterJsonDeep(parsedForTree.value, searchQuery.value.trim())
})

// Helper to normalize JSON data for Table View
const tableData = computed<Array<Record<string, unknown>>>(() => {
  const data = filteredParsedData.value !== undefined ? filteredParsedData.value : parsedForTree.value
  if (!data) return []

  if (Array.isArray(data)) {
    return data.map((item, idx) => {
      if (typeof item === 'object' && item !== null) return { _index: idx, ...item }
      return { _index: idx, value: item }
    })
  }

  if (typeof data === 'object' && data !== null) {
    return Object.entries(data).map(([key, value]) => ({
      key,
      value
    }))
  }

  return []
})

// Filtered Table Data based on Search Query
const filteredTableData = computed(() => {
  if (!searchQuery.value.trim()) return tableData.value

  const query = searchQuery.value.toLowerCase().trim()
  return tableData.value.filter(row => {
    return Object.entries(row).some(([key, val]) => {
      const formattedVal = formatTableCellValue(val).toLowerCase()
      return key.toLowerCase().includes(query) || formattedVal.includes(query)
    })
  })
})

// Get table headers dynamically
const tableHeaders = computed<string[]>(() => {
  if (!tableData.value.length) return []
  const keysSet = new Set<string>()
  tableData.value.forEach(row => {
    Object.keys(row).forEach(k => keysSet.add(k))
  })
  return Array.from(keysSet)
})

/** Formats values cleanly inside table cells without truncation */
function formatTableCellValue(val: unknown): string {
  if (val === null || val === undefined) return '-'
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val, null, 2)
    } catch {
      return String(val)
    }
  }
  return String(val)
}

const STORAGE_KEY = 'json-formatter:content'

// Keep raw state in sync & reset tree clear when content changes
watch(content, (next) => {
  state.value.raw = next
  if (isTreeCleared.value) {
    isTreeCleared.value = false
  }

  try {
    if (next) {
      localStorage.setItem(STORAGE_KEY, next)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch (err) {
    console.error('Failed to save JSON to localStorage:', err)
  }
})

/** Helper: Gets formatted JSON string dynamically for any node input */
function getFormattedText(dataToFormat?: unknown): string {
  const target = dataToFormat !== undefined ? dataToFormat : parsedForTree.value
  if (!target) return content.value

  const indent = typeof options.value.indentSize === 'number' ? options.value.indentSize : 2
  try {
    return JSON.stringify(target, null, indent)
  } catch {
    return content.value
  }
}

// Filtered Formatted String for Text & Code view modes
const filteredFormattedText = computed(() => {
  if (!searchQuery.value.trim() && !jmesQuery.value.trim()) return getFormattedText()
  if (filteredParsedData.value === undefined) return ''
  return getFormattedText(filteredParsedData.value)
})

// YAML export text, derived from whatever the tree/search/JMESPath filters produced
const filteredYamlText = computed(() => {
  const data = filteredParsedData.value !== undefined ? filteredParsedData.value : parsedForTree.value
  if (data === undefined) return ''
  try {
    return jsonToYaml(data)
  } catch {
    return ''
  }
})

// CSV export text, reusing the same row/header shaping as the Table view
const filteredCsvText = computed(() => {
  const rows = filteredTableData.value
  if (!rows.length) return ''
  return rowsToCsv(tableHeaders.value, rows)
})

/** 1. Format Code in Editor & View */
function runFormat() {
  if (format(content.value)) {
    content.value = state.value.formatted
  }
}

/** 2. Minify Code */
function runMinify() {
  if (minify(content.value)) {
    content.value = state.value.formatted
  }
}

/** 3. Handle Indent Changes */
function handleIndentChange(size: IndentSize) {
  setIndentSize(size)
  if (state.value.isValid && content.value.trim() !== '') {
    content.value = state.value.formatted
  }
}

/** 4. Sort Fields */
function handleSortToggle() {
  toggleSortKeys()
  if (state.value.isValid && content.value.trim() !== '') {
    content.value = state.value.formatted
  }
}

/** Wraps the current editor text as a JSON-escaped string literal (for embedding JSON inside another string/log line) */
function handleEscape() {
  if (!content.value) return
  content.value = JSON.stringify(content.value)
}

/** Unwraps a JSON string literal back into raw text (e.g. JSON pasted from inside a log line) */
function handleUnescape() {
  if (!content.value) return
  try {
    const parsed = JSON.parse(content.value)
    if (typeof parsed === 'string') {
      content.value = parsed
    } else {
      pushToast('Content is not an escaped JSON string', 'info')
    }
  } catch {
    pushToast('Content is not a valid escaped JSON string', 'error')
  }
}

/** 5. Clear Data */
function handleClear() {
  content.value = ''
  clear()
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('Failed to clear JSON from localStorage:', err)
  }
}

/** Load Sample Data */
function handleLoadSample(sample: SampleDataset) {
  loadSample(sample.json)
  content.value = state.value.formatted || sample.json
}

/** Text + suggested filename for whatever the active view tab is currently showing */
function activeViewExport(): { text: string; filename: string } {
  switch (viewMode.value) {
    case 'yaml':
      return { text: filteredYamlText.value, filename: 'data.yaml' }
    case 'csv':
      return { text: filteredCsvText.value, filename: 'data.csv' }
    default:
      return { text: filteredFormattedText.value, filename: 'data.json' }
  }
}

/** 6. Copy Code */
function handleCopy(payload?: string) {
  const textToCopy = (typeof payload === 'string' && payload) ? payload : activeViewExport().text
  if (!textToCopy) return

  copyToClipboard(textToCopy)
  treeCopied.value = true
  setTimeout(() => {
    treeCopied.value = false
  }, 1500)
}

/** 7. Download JSON Data */
function handleDownload(payload?: string) {
  const target = activeViewExport()
  const textToDownload = (typeof payload === 'string' && payload) ? payload : target.text
  if (!textToDownload) return

  downloadJson(textToDownload, target.filename)
}

function handleClearTreeOnly() {
  isTreeCleared.value = true
  searchQuery.value = ''
  jmesQuery.value = ''
}

function handleLocaleSelect(next: Locale) {
  setLocale(next)
}

const isSharing = ref(false)
const historyMenuOpen = ref(false)
const moreMenuOpen = ref(false)

// Diff mode: compares the current document against a second, pasted-in JSON doc
const isDiffMode = ref(false)
const diffCompareText = ref('')

function handleDiffFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      diffCompareText.value = (e.target?.result as string) ?? ''
    }
    reader.readAsText(file)
  }
  if (target) target.value = ''
}

function formatDiffCompareText() {
  try {
    const parsed = JSON.parse(diffCompareText.value)
    diffCompareText.value = JSON.stringify(parsed, null, options.value.indentSize)
  } catch {
    pushToast('Right-hand document is not valid JSON', 'error')
  }
}

function handleSaveToHistory() {
  if (!content.value.trim()) return
  saveHistory(content.value)
  pushToast('Saved to history', 'success')
}

function handleRestoreHistory(entryContent: string) {
  content.value = entryContent
  if (format(entryContent)) {
    content.value = state.value.formatted
  }
  historyMenuOpen.value = false
}

function formatHistoryTime(savedAt: number): string {
  return new Date(savedAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Compresses the current document into the URL hash and copies a shareable link */
async function handleShare() {
  if (!content.value.trim() || isSharing.value) return
  isSharing.value = true
  try {
    const token = await encodeShareHash(content.value)
    const url = `${location.origin}${location.pathname}#${token}`
    history.replaceState(null, '', `#${token}`)
    await copyToClipboard(url)
  } finally {
    isSharing.value = false
  }
}

onMounted(async () => {
  initTheme()
  initFontSettings()
  initLocale()
  initHistory()
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  // A share link in the URL hash takes priority over the last locally saved document
  let loadedFromShare = false
  if (location.hash) {
    const shared = await decodeShareHash(location.hash)
    if (shared !== null) {
      content.value = shared
      loadedFromShare = true
    }
  }

  if (!loadedFromShare) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        content.value = saved
      }
    } catch (err) {
      console.error('Failed to load JSON from localStorage:', err)
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<template>
  <div class="flex h-screen flex-col bg-ink text-parchment">
    <header class="flex items-center justify-between border-b border-surface-hair bg-surface px-5 py-3">
      <div class="flex items-center gap-3">
        <span class="flex h-9 w-9 items-center justify-center rounded bg-key/15 border border-key/30">
          <Logo :size="22" />
        </span>
        <div class="leading-tight">
          <h1 class="font-mono text-sm font-bold uppercase tracking-wide text-parchment">{{ t('header.title') }}</h1>
          <p class="text-xs text-muted">{{ t('header.subtitle') }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 text-xs">
          <template v-if="!isEmpty">
            <span v-if="liveValidation.valid" class="flex items-center gap-1.5 font-mono uppercase tracking-wide text-string">
              <CheckCircle2 class="h-4 w-4" aria-hidden="true" />
              {{ t('status.valid') }}
            </span>
            <span v-else class="flex items-center gap-1.5 font-mono uppercase tracking-wide text-boolean">
              <XCircle class="h-4 w-4" aria-hidden="true" />
              {{ t('status.invalid') }}
            </span>
          </template>
        </div>
        <div class="h-5 w-px bg-surface-hair" aria-hidden="true" />
        <div class="flex items-center rounded border border-surface-hair p-0.5 text-xs" :aria-label="t('lang.label')">
          <button v-for="opt in localeOptions" :key="opt.code" type="button" class="rounded px-2 py-1 transition"
            :class="locale === opt.code ? 'bg-key/20 text-key' : 'text-muted hover:text-parchment'"
            :aria-pressed="locale === opt.code" :lang="opt.code" @click="handleLocaleSelect(opt.code)">
            {{ opt.code.toUpperCase() }}
          </button>
        </div>
        <div class="relative">
          <button type="button"
            class="flex h-8 w-8 items-center justify-center rounded border border-surface-hair text-parchment transition hover:border-key/50 hover:text-key"
            title="Theme" aria-label="Theme" :aria-expanded="themeMenuOpen" @click="themeMenuOpen = !themeMenuOpen">
            <Flower class="h-4 w-4" aria-hidden="true" />
          </button>
          <div v-if="themeMenuOpen"
            class="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded border border-surface-hair bg-surface-raised shadow-panel font-mono">
            <div class="flex items-center justify-between border-b border-surface-hair px-3 py-2">
              <span class="text-[10.5px] uppercase tracking-wide text-muted">Mode</span>
              <div class="flex items-center rounded border border-surface-hair p-0.5 text-xs">
                <button type="button" class="flex items-center gap-1 rounded px-2 py-1 transition"
                  :class="theme === 'dark' ? 'bg-key/20 text-key' : 'text-muted hover:text-parchment'"
                  :aria-pressed="theme === 'dark'" @click="setTheme('dark')">
                  <Moon class="h-3 w-3" aria-hidden="true" />
                </button>
                <button type="button" class="flex items-center gap-1 rounded px-2 py-1 transition"
                  :class="theme === 'light' ? 'bg-key/20 text-key' : 'text-muted hover:text-parchment'"
                  :aria-pressed="theme === 'light'" @click="setTheme('light')">
                  <Sun class="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div class="p-1">
              <p class="px-2 py-1 text-[10.5px] uppercase tracking-wide text-muted">Theme</p>
              <button v-for="opt in themePresetOptions" :key="opt.id" type="button"
                class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-parchment transition hover:bg-key/10 hover:text-key"
                :aria-pressed="preset === opt.id" @click="setPreset(opt.id)">
                <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ background: opt.swatch }" aria-hidden="true" />
                {{ opt.label }}
                <Check v-if="preset === opt.id" class="ml-auto h-3.5 w-3.5 text-key" aria-hidden="true" />
              </button>
            </div>
            <div class="border-t border-surface-hair p-1">
              <p class="px-2 py-1 text-[10.5px] uppercase tracking-wide text-muted">Font</p>
              <div class="px-2 pb-1.5">
                <select
                  class="w-full rounded border border-surface-hair bg-surface px-2 py-1 text-xs text-parchment focus:border-key/50 focus:outline-none"
                  :value="fontFamily"
                  aria-label="Font family"
                  @change="setFontFamily(($event.target as HTMLSelectElement).value as FontFamily)">
                  <option v-for="opt in fontFamilyOptions" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
                </select>
              </div>
              <div class="flex items-center justify-between px-2 pb-1.5">
                <span class="text-xs text-muted">Size</span>
                <div class="flex items-center gap-1">
                  <button type="button"
                    class="flex h-6 w-6 items-center justify-center rounded border border-surface-hair text-parchment transition hover:border-key/50 hover:text-key disabled:cursor-not-allowed disabled:opacity-30"
                    :disabled="fontSize <= FONT_SIZE_MIN" aria-label="Decrease font size" @click="setFontSize(fontSize - 1)">
                    <Minus class="h-3 w-3" aria-hidden="true" />
                  </button>
                  <span class="w-9 text-center font-mono text-xs text-parchment">{{ fontSize }}px</span>
                  <button type="button"
                    class="flex h-6 w-6 items-center justify-center rounded border border-surface-hair text-parchment transition hover:border-key/50 hover:text-key disabled:cursor-not-allowed disabled:opacity-30"
                    :disabled="fontSize >= FONT_SIZE_MAX" aria-label="Increase font size" @click="setFontSize(fontSize + 1)">
                    <Plus class="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button type="button"
          class="flex h-8 w-8 items-center justify-center rounded border transition"
          :class="isDiffMode ? 'border-key/50 bg-key/20 text-key' : 'border-surface-hair text-parchment hover:border-key/50 hover:text-key'"
          title="Compare two JSON documents" aria-label="Compare two JSON documents" :aria-pressed="isDiffMode"
          @click="isDiffMode = !isDiffMode">
          <GitCompare class="h-4 w-4" aria-hidden="true" />
        </button>
        <div class="relative">
          <button type="button"
            class="flex h-8 w-8 items-center justify-center rounded border border-surface-hair text-parchment transition hover:border-key/50 hover:text-key"
            title="Document history" aria-label="Document history" :aria-expanded="historyMenuOpen"
            @click="historyMenuOpen = !historyMenuOpen">
            <History class="h-4 w-4" aria-hidden="true" />
          </button>
          <div v-if="historyMenuOpen"
            class="absolute right-0 top-full z-20 mt-1 w-80 overflow-hidden rounded border border-surface-hair bg-surface-raised shadow-panel">
            <div class="flex items-center justify-between border-b border-surface-hair px-3 py-1.5">
              <span class="font-mono text-[11px] uppercase tracking-wide text-muted">History</span>
              <button v-if="historyEntries.length" type="button"
                class="flex items-center gap-1 text-[11px] text-muted transition hover:text-boolean"
                @click="clearHistory">
                <Trash class="h-3 w-3" aria-hidden="true" />
                Clear
              </button>
            </div>
            <ul class="max-h-72 overflow-auto">
              <li v-if="!historyEntries.length" class="px-3 py-3 text-xs text-muted">
                No saved documents yet — use "Save to history" in the More menu.
              </li>
              <li v-for="entry in historyEntries" :key="entry.id"
                class="group flex items-start gap-2 border-b border-surface-hair/50 px-3 py-2 last:border-b-0 hover:bg-key/10">
                <button type="button" class="min-w-0 flex-1 text-left" @click="handleRestoreHistory(entry.content)">
                  <p class="truncate font-mono text-xs text-parchment">{{ entry.preview }}</p>
                  <p class="text-[10px] text-muted">{{ formatHistoryTime(entry.savedAt) }}</p>
                </button>
                <button type="button"
                  class="mt-0.5 shrink-0 rounded p-0.5 text-muted opacity-0 transition hover:text-boolean group-hover:opacity-100"
                  title="Remove" @click="removeHistoryEntry(entry.id)">
                  <Trash class="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div class="relative">
          <button type="button"
            class="flex h-8 w-8 items-center justify-center rounded border border-surface-hair text-parchment transition hover:border-key/50 hover:text-key"
            title="More" aria-label="More options" :aria-expanded="moreMenuOpen" @click="moreMenuOpen = !moreMenuOpen">
            <Ellipsis class="h-4 w-4" aria-hidden="true" />
          </button>
          <div v-if="moreMenuOpen"
            class="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded border border-surface-hair bg-surface-raised shadow-panel font-mono">
            <button type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-parchment transition hover:bg-key/10 hover:text-key"
              @click="toggleFullscreen(); moreMenuOpen = false">
              <Minimize2 v-if="isFullscreen" class="h-3.5 w-3.5" aria-hidden="true" />
              <Maximize2 v-else class="h-3.5 w-3.5" aria-hidden="true" />
              {{ isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen' }}
            </button>
            <button type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-parchment transition enabled:hover:bg-key/10 enabled:hover:text-key disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="isEmpty || isSharing" @click="handleShare(); moreMenuOpen = false">
              <Share class="h-3.5 w-3.5" aria-hidden="true" />
              Copy shareable link
            </button>
            <button type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-parchment transition enabled:hover:bg-key/10 enabled:hover:text-key disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="isEmpty" @click="handleSaveToHistory(); moreMenuOpen = false">
              <Bookmark class="h-3.5 w-3.5" aria-hidden="true" />
              Save to history
            </button>
          </div>
        </div>
      </div>
    </header>
    <Toolbar :indent-size="options.indentSize" :sort-keys="options.sortKeys ?? false" :show-tree="showTree"
      :can-download="canDownload || (!isEmpty && liveValidation.valid)" :samples="sampleDatasets" @format="runFormat"
      @minify="runMinify" @clear="handleClear" @copy="handleCopy()" @download="handleDownload()"
      @load-sample="handleLoadSample" @toggle-tree="showTree = !showTree" @toggle-sort="handleSortToggle"
      @update:indent-size="handleIndentChange" @escape="handleEscape" @unescape="handleUnescape" />

    <div v-if="!isEmpty && !liveValidation.valid && liveValidation.error" class="px-4 pt-3">
      <ErrorBanner :error="liveValidation.error" />
    </div>

    <main v-if="isDiffMode" class="flex min-h-0 flex-1 flex-col gap-2 p-4">
      <div class="flex items-center justify-between rounded-lg border border-surface-hair bg-surface px-3 py-2">
        <div class="flex items-center gap-4 font-mono text-[11px] uppercase tracking-wide text-muted">
          <span>Left: current document</span>
          <span>Right: paste or upload a document to compare</span>
        </div>
        <div class="flex items-center gap-2">
          <input ref="diffFileInputRef" type="file" accept=".json,.txt" class="hidden" @change="handleDiffFileChange" />
          <button type="button"
            class="flex items-center gap-1 rounded border border-surface-hair px-2 py-1 text-xs text-parchment transition hover:border-key/50 hover:text-key"
            @click="diffFileInputRef?.click()">
            <Upload class="h-3.5 w-3.5" aria-hidden="true" />
            Upload right side
          </button>
          <button type="button"
            class="flex items-center gap-1 rounded border border-surface-hair px-2 py-1 text-xs text-parchment transition hover:border-key/50 hover:text-key"
            @click="formatDiffCompareText">
            <WandSparkles class="h-3.5 w-3.5" aria-hidden="true" />
            Format right side
          </button>
        </div>
      </div>
      <section class="min-h-0 flex-1 overflow-hidden rounded-lg border border-surface-hair bg-surface shadow-panel">
        <ClientOnly>
          <DiffViewer :original="content" v-model:modified="diffCompareText" />
          <template #fallback>
            <div class="flex h-full items-center justify-center text-xs text-muted">
              {{ t('editor.loading') }}
            </div>
          </template>
        </ClientOnly>
      </section>
    </main>

    <main v-else class="flex min-h-0 flex-1 gap-0 p-4 select-none">
      <section
        class="relative flex min-h-0 flex-col overflow-hidden rounded-lg border border-surface-hair bg-surface shadow-panel"
        :style="showTree ? `flex-basis: ${leftPanelWidth}%` : 'flex-basis: 100%'"
        @dragenter.prevent="handleDragEnter" @dragover.prevent @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop">
        <div class="flex items-center justify-between border-b border-surface-hair px-3 py-1.5">
          <span class="text-[11px] uppercase tracking-wide text-muted">{{ t('editor.label') }}</span>
          <div>
            <input ref="fileInputRef" type="file" accept=".json,.txt" class="hidden" @change="handleFileChange" />
            <button type="button"
              class="flex items-center gap-1 rounded border border-surface-hair bg-surface-raised px-2 py-0.5 text-[11px] text-parchment transition hover:border-key/50 hover:text-key"
              title="Upload JSON File" @click="triggerFileUpload">
              <Upload class="h-3 w-3 text-key" />
              <span>Upload File</span>
            </button>
          </div>
        </div>
        <div class="min-h-0 flex-1">
          <ClientOnly>
            <JsonEditor v-model="content" />
            <template #fallback>
              <div class="flex h-full items-center justify-center text-xs text-muted">
                {{ t('editor.loading') }}
              </div>
            </template>
          </ClientOnly>
        </div>
        <div v-if="isDraggingFile"
          class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed border-key bg-ink/80">
          <span class="flex items-center gap-2 text-sm font-medium text-key">
            <Upload class="h-4 w-4" aria-hidden="true" />
            Drop JSON file to load
          </span>
        </div>
      </section>
      <div v-if="showTree" class="w-3 flex items-center justify-center cursor-col-resize group px-0.5"
        @mousedown="startResize">
        <div class="h-8 w-1 rounded-full bg-surface-hair group-hover:bg-key transition-colors"></div>
      </div>
      <section v-if="showTree"
        class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-surface-hair bg-surface shadow-panel"
        :style="`flex-basis: ${100 - leftPanelWidth}%`">
        <div class="flex flex-col border-b border-surface-hair">
          <!-- Folder-tab view switcher -->
          <div class="flex items-end gap-0.5 overflow-x-auto bg-surface-raised px-2 pt-2">
            <button v-for="tab in viewTabs" :key="tab.id" type="button"
              class="flex shrink-0 items-center gap-1.5 px-3 pb-2 pt-1.5 font-mono text-[10.5px] uppercase tracking-wide transition [clip-path:polygon(10%_0,90%_0,100%_100%,0%_100%)]"
              :class="viewMode === tab.id ? 'bg-surface font-bold text-key' : 'bg-surface-raised text-muted hover:text-parchment'"
              :aria-pressed="viewMode === tab.id" @click="viewMode = tab.id">
              <component :is="tab.icon" class="h-3 w-3" aria-hidden="true" />
              {{ tab.label }}
            </button>
          </div>
          <div class="flex items-center justify-between gap-2 px-3 py-1.5">
            <div class="relative flex items-center flex-1 max-w-[160px]">
              <Search class="absolute left-2 h-3.5 w-3.5 text-muted pointer-events-none" />
              <input v-model="searchQuery" type="text" placeholder="Find field..."
                class="w-full rounded border border-surface-hair bg-surface-raised pl-7 pr-6 py-0.5 text-xs text-parchment placeholder-muted/60 focus:border-key/50 focus:outline-none" />
              <button v-if="searchQuery" type="button" class="absolute right-1.5 text-muted hover:text-parchment"
                @click="searchQuery = ''">
                <X class="h-3 w-3" />
              </button>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button type="button"
                class="flex items-center gap-1 rounded border border-surface-hair px-1.5 py-0.5 text-xs text-muted transition hover:border-key/50 hover:text-key"
                title="Sort Keys" @click="handleSortToggle">
                <ArrowUpDown class="h-3.5 w-3.5" />
              </button>

              <button type="button"
                class="flex items-center gap-1 rounded border border-surface-hair px-1.5 py-0.5 text-xs text-muted transition hover:border-key/50 hover:text-key"
                title="Copy Formatted JSON" @click="handleCopy()">
                <Check v-if="treeCopied" class="h-3.5 w-3.5 text-key" />
                <Copy v-else class="h-3.5 w-3.5" />
              </button>

              <button type="button"
                class="flex items-center gap-1 rounded border border-surface-hair px-1.5 py-0.5 text-xs text-muted transition hover:border-key/50 hover:text-key"
                title="Download Formatted JSON" @click="handleDownload()">
                <Download class="h-3.5 w-3.5" />
              </button>

              <button type="button"
                class="flex items-center gap-1 rounded border border-surface-hair px-1.5 py-0.5 text-xs text-muted transition hover:border-boolean/50 hover:text-boolean"
                title="Clear Panel" @click="handleClearTreeOnly">
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2 border-t border-surface-hair/60 bg-surface-raised/40 px-3 py-1">
            <Code class="h-3.5 w-3.5 text-key shrink-0" />
            <span class="text-[11px] font-mono font-medium text-key">JMESPath:</span>

            <div class="relative flex-1">
              <input v-model="jmesQuery" type="text" placeholder="e.g. medical_histories[*].value[] or code"
                class="w-full rounded border border-surface-hair bg-surface pl-2 pr-6 py-0.5 font-mono text-xs text-parchment placeholder-muted/40 focus:border-key/50 focus:outline-none" />
              <button v-if="jmesQuery" type="button"
                class="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted hover:text-parchment"
                @click="jmesQuery = ''">
                <X class="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <!-- JMESPath Error Box -->
        <div v-if="jmesError"
          class="bg-boolean/10 border-b border-boolean/30 px-3 py-1.5 text-xs text-boolean font-mono">
          JMESPath Error: {{ jmesError }}
        </div>

        <!-- Panel Content Display Based on View Mode -->
        <div class="min-h-0 flex-1 overflow-auto p-2">
          <div v-if="isTreeCleared" class="p-2 font-mono text-xs text-muted">
            View panel cleared.
          </div>

          <!-- 1. Interactive Tree View -->
          <template v-else-if="viewMode === 'tree'">
            <TreeViewer v-if="!isEmpty && liveValidation.valid && filteredParsedData !== undefined" :node-key="null"
              :value="filteredParsedData" path="$" :depth="0" @copy="handleCopy" @download="handleDownload"
              @sort="handleSortToggle" @copy-path="(p) => copyToClipboard(p)" />
            <p v-else-if="(searchQuery || jmesQuery) && filteredParsedData === undefined"
              class="p-2 text-xs text-muted">
              No matching fields found.
            </p>
            <p v-else class="p-2 text-xs text-muted">
              {{ isEmpty ? t('tree.emptyState') : t('tree.fixError') }}
            </p>
          </template>

          <!-- 2. Formatted Raw Text View -->
          <template v-else-if="viewMode === 'text'">
            <pre v-if="!isEmpty && liveValidation.valid && filteredFormattedText"
              class="whitespace-pre-wrap font-mono text-[length:var(--font-size-content)] text-parchment selection:bg-key/30 p-2 leading-relaxed">{{ filteredFormattedText }}</pre>
            <p v-else-if="(searchQuery || jmesQuery) && !filteredFormattedText" class="p-2 text-xs text-muted">
              No matching fields found.
            </p>
            <p v-else class="p-2 text-xs text-muted">
              {{ isEmpty ? t('tree.emptyState') : t('tree.fixError') }}
            </p>
          </template>

          <!-- 3. Dynamic Table View with Search/Filter -->
          <template v-else-if="viewMode === 'table'">
            <div v-if="!isEmpty && liveValidation.valid && filteredTableData.length > 0" class="overflow-x-auto p-1">
              <table class="w-full text-left font-mono text-[length:var(--font-size-content)] border-collapse border border-surface-hair">
                <thead>
                  <tr class="bg-surface-raised border-b border-surface-hair text-muted uppercase text-[10px]">
                    <th v-for="header in tableHeaders" :key="header" class="px-2.5 py-1.5 border-r border-surface-hair">
                      {{ header }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in filteredTableData" :key="idx"
                    class="border-b border-surface-hair/50 hover:bg-surface-hair/20">
                    <td v-for="header in tableHeaders" :key="header"
                      class="px-2.5 py-1.5 border-r border-surface-hair/50 text-parchment/90 break-all whitespace-pre-wrap font-mono align-top">
                      {{ formatTableCellValue(row[header]) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-else class="p-2 text-xs text-muted">
              {{ (searchQuery || jmesQuery) ? 'No matching fields found.' : (isEmpty ? t('tree.emptyState') :
                t('tree.fixError')) }}
            </p>
          </template>

          <!-- 4. Read-Only Code View -->
          <template v-else-if="viewMode === 'code'">
            <div v-if="!isEmpty && liveValidation.valid && filteredFormattedText" class="h-full">
              <ClientOnly>
                <JsonEditor :model-value="filteredFormattedText" readonly />
              </ClientOnly>
            </div>
            <p v-else-if="(searchQuery || jmesQuery) && !filteredFormattedText" class="p-2 text-xs text-muted">
              No matching fields found.
            </p>
            <p v-else class="p-2 text-xs text-muted">
              {{ isEmpty ? t('tree.emptyState') : t('tree.fixError') }}
            </p>
          </template>

          <!-- 5. YAML Export View -->
          <template v-else-if="viewMode === 'yaml'">
            <pre v-if="!isEmpty && liveValidation.valid && filteredYamlText"
              class="whitespace-pre-wrap font-mono text-[length:var(--font-size-content)] text-parchment selection:bg-key/30 p-2 leading-relaxed">{{ filteredYamlText }}</pre>
            <p v-else-if="(searchQuery || jmesQuery) && !filteredYamlText" class="p-2 text-xs text-muted">
              No matching fields found.
            </p>
            <p v-else class="p-2 text-xs text-muted">
              {{ isEmpty ? t('tree.emptyState') : t('tree.fixError') }}
            </p>
          </template>

          <!-- 6. CSV Export View (tabular data only) -->
          <template v-else-if="viewMode === 'csv'">
            <pre v-if="!isEmpty && liveValidation.valid && filteredCsvText"
              class="whitespace-pre-wrap font-mono text-[length:var(--font-size-content)] text-parchment selection:bg-key/30 p-2 leading-relaxed">{{ filteredCsvText }}</pre>
            <p v-else-if="!isEmpty && liveValidation.valid" class="p-2 text-xs text-muted">
              Top-level value must be an object or array to export as CSV.
            </p>
            <p v-else class="p-2 text-xs text-muted">
              {{ isEmpty ? t('tree.emptyState') : t('tree.fixError') }}
            </p>
          </template>

          <!-- 7. JSON Schema Validation -->
          <template v-else-if="viewMode === 'schema'">
            <SchemaPanel :data="parsedForTree" :has-data="!isEmpty && liveValidation.valid" />
          </template>
        </div>
      </section>
    </main>

    <!-- Toasts Notifications -->
    <div class="pointer-events-none fixed bottom-4 right-4 flex flex-col gap-2">
      <div v-for="toast in toasts" :key="toast.id" class="rounded border px-3 py-2 text-xs shadow-panel" :class="{
        'border-string/40 bg-string/10 text-string': toast.variant === 'success',
        'border-boolean/40 bg-boolean/10 text-boolean': toast.variant === 'error',
        'border-surface-hair bg-surface-raised text-parchment': toast.variant === 'info',
      }">
        {{ toast.text }}
      </div>
    </div>
  </div>
</template>