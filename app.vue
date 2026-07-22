<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import jmespath from 'jmespath'
import {
  CheckCircle2,
  XCircle,
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
  Upload
} from 'lucide-vue-next'
import { useJsonFormatter } from '~/composables/useJsonFormatter'
import { useClipboard } from '~/composables/useClipboard'
import { useLocale } from '~/composables/useLocale'
import { useTheme } from '~/composables/useTheme'
import { sampleDatasets } from '~/utils/sampleData'
import { localeOptions } from '~/types/i18n'
import type { IndentSize, SampleDataset } from '~/types/json'
import type { Locale } from '~/types/i18n'

// View mode type definition
type ViewMode = 'tree' | 'text' | 'table' | 'code'

const { state, options, validate, format, minify, setIndentSize, toggleSortKeys, clear, loadSample, canDownload } =
  useJsonFormatter()
const { toasts, copyToClipboard, downloadJson } = useClipboard()
const { locale, t, setLocale, initLocale } = useLocale()
const { theme, toggleTheme, initTheme } = useTheme()

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

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    if (text) {
      content.value = text
      if (format(text)) {
        content.value = state.value.formatted
      }
    }
    // Reset file input value so the same file can be uploaded again if needed
    if (target) target.value = ''
  }
  reader.readAsText(file)
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

// Keep raw state in sync & reset tree clear when content changes
watch(content, (next) => {
  state.value.raw = next
  if (isTreeCleared.value) {
    isTreeCleared.value = false
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

/** 5. Clear Data */
function handleClear() {
  content.value = ''
  clear()
}

/** Load Sample Data */
function handleLoadSample(sample: SampleDataset) {
  loadSample(sample.json)
  content.value = state.value.formatted || sample.json
}

/** 6. Copy Code */
function handleCopy(payload?: string) {
  const textToCopy = (typeof payload === 'string' && payload) ? payload : filteredFormattedText.value
  if (!textToCopy) return

  copyToClipboard(textToCopy)
  treeCopied.value = true
  setTimeout(() => {
    treeCopied.value = false
  }, 1500)
}

/** 7. Download JSON Data */
function handleDownload(payload?: string) {
  const textToDownload = (typeof payload === 'string' && payload) ? payload : filteredFormattedText.value
  if (!textToDownload) return

  downloadJson(textToDownload, 'data.json')
}

function handleClearTreeOnly() {
  isTreeCleared.value = true
  searchQuery.value = ''
  jmesQuery.value = ''
}

function handleLocaleSelect(next: Locale) {
  setLocale(next)
}

onMounted(() => {
  initTheme()
  initLocale()
})
</script>

<template>
  <div class="flex h-screen flex-col bg-ink text-parchment">
    <header class="flex items-center justify-between border-b border-surface-hair bg-surface px-5 py-3">
      <div class="flex items-center gap-3">
        <span
          class="flex h-10 w-10 items-center justify-center rounded bg-surface-raised border border-surface-hair overflow-hidden p-1">
          <img src="public/npca_logo.png" alt="NPCA Logo" class="h-full w-full object-contain" />
        </span>
        <span class="flex h-9 w-9 items-center justify-center rounded bg-key/15 border border-key/30">
          <Logo :size="22" />
        </span>
        <div class="leading-tight">
          <h1 class="text-sm font-semibold text-parchment">{{ t('header.title') }}</h1>
          <p class="text-xs text-muted">{{ t('header.subtitle') }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 text-xs">
          <template v-if="!isEmpty">
            <span v-if="liveValidation.valid" class="flex items-center gap-1.5 text-string">
              <CheckCircle2 class="h-4 w-4" aria-hidden="true" />
              {{ t('status.valid') }}
            </span>
            <span v-else class="flex items-center gap-1.5 text-boolean">
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
        <button type="button"
          class="flex h-8 w-8 items-center justify-center rounded border border-surface-hair text-parchment transition hover:border-key/50 hover:text-key"
          :title="theme === 'dark' ? t('theme.toLight') : t('theme.toDark')"
          :aria-label="theme === 'dark' ? t('theme.toLight') : t('theme.toDark')" @click="toggleTheme">
          <Sun v-if="theme === 'dark'" class="h-4 w-4" aria-hidden="true" />
          <Moon v-else class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
    <Toolbar :indent-size="options.indentSize" :sort-keys="options.sortKeys ?? false" :show-tree="showTree"
      :can-download="canDownload || (!isEmpty && liveValidation.valid)" :samples="sampleDatasets" @format="runFormat"
      @minify="runMinify" @clear="handleClear" @copy="handleCopy()" @download="handleDownload()"
      @load-sample="handleLoadSample" @toggle-tree="showTree = !showTree" @toggle-sort="handleSortToggle"
      @update:indent-size="handleIndentChange" />

    <div v-if="!isEmpty && !liveValidation.valid && liveValidation.error" class="px-4 pt-3">
      <ErrorBanner :error="liveValidation.error" />
    </div>

    <main class="flex min-h-0 flex-1 gap-0 p-4 select-none">
      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-surface-hair bg-surface shadow-panel"
        :style="showTree ? `flex-basis: ${leftPanelWidth}%` : 'flex-basis: 100%'">
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
      </section>
      <div v-if="showTree" class="w-3 flex items-center justify-center cursor-col-resize group px-0.5"
        @mousedown="startResize">
        <div class="h-8 w-1 rounded-full bg-surface-hair group-hover:bg-key transition-colors"></div>
      </div>
      <section v-if="showTree"
        class="flex min-h-0 flex-col overflow-hidden rounded-lg border border-surface-hair bg-surface shadow-panel"
        :style="`flex-basis: ${100 - leftPanelWidth}%`">
        <div class="flex flex-col border-b border-surface-hair">
          <div class="flex items-center justify-between gap-2 px-3 py-1.5">
            <div class="flex items-center gap-1 shrink-0 rounded bg-surface-raised p-0.5 text-xs">
              <button type="button"
                class="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition"
                :class="viewMode === 'tree' ? 'bg-key/20 text-key' : 'text-muted hover:text-parchment'"
                @click="viewMode = 'tree'">
                <FolderTree class="h-3 w-3" />
                Tree
              </button>
              <button type="button"
                class="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition"
                :class="viewMode === 'text' ? 'bg-key/20 text-key' : 'text-muted hover:text-parchment'"
                @click="viewMode = 'text'">
                <FileText class="h-3 w-3" />
                Text
              </button>
              <button type="button"
                class="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition"
                :class="viewMode === 'table' ? 'bg-key/20 text-key' : 'text-muted hover:text-parchment'"
                @click="viewMode = 'table'">
                <Table class="h-3 w-3" />
                Table
              </button>
              <button type="button"
                class="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition"
                :class="viewMode === 'code' ? 'bg-key/20 text-key' : 'text-muted hover:text-parchment'"
                @click="viewMode = 'code'">
                <Code2 class="h-3 w-3" />
                Code
              </button>
            </div>
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
              @sort="handleSortToggle" />
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
              class="whitespace-pre-wrap font-mono text-xs text-parchment selection:bg-key/30 p-2 leading-relaxed">{{ filteredFormattedText }}</pre>
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
              <table class="w-full text-left font-mono text-xs border-collapse border border-surface-hair">
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