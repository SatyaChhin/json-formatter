<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { CheckCircle2, XCircle, Sun, Moon, FolderTree, ArrowUpDown, Copy, Download, Trash2, Check } from 'lucide-vue-next'
import { useJsonFormatter } from '~/composables/useJsonFormatter'
import { useClipboard } from '~/composables/useClipboard'
import { useLocale } from '~/composables/useLocale'
import { useTheme } from '~/composables/useTheme'
import { sampleDatasets } from '~/utils/sampleData'
import { localeOptions } from '~/types/i18n'
import type { IndentSize, SampleDataset } from '~/types/json'
import type { Locale } from '~/types/i18n'

const { state, options, validate, format, minify, setIndentSize, toggleSortKeys, clear, loadSample, canDownload } =
  useJsonFormatter()
const { toasts, copyToClipboard, downloadJson } = useClipboard()
const { locale, t, setLocale, initLocale } = useLocale()
const { theme, toggleTheme, initTheme } = useTheme()

// Editor state text content
const content = ref('')
const showTree = ref(true) 
const isTreeCleared = ref(false)
const treeCopied = ref(false)

// Live validation on every keystroke
const liveValidation = computed(() => validate(content.value))
const isEmpty = computed(() => content.value.trim() === '')

const parsedForTree = computed<unknown>(() => {
  if (!liveValidation.value.valid) return undefined
  return liveValidation.value.data
})

// Keep raw state in sync & reset tree clear when content changes
watch(content, (next) => {
  state.value.raw = next
  if (isTreeCleared.value) {
    isTreeCleared.value = false
  }
})

/** Helper: Gets formatted JSON string dynamically */
function getFormattedText(): string {
  if (!content.value.trim()) return ''
  // Try running format to ensure state.formatted is up to date
  if (liveValidation.value.valid && format(content.value)) {
    return state.value.formatted
  }
  return content.value
}

/** 1. Format Code in Editor & Tree */
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

/** 4. Sort Fields in Editor & Tree view */
function handleSortToggle() {
  toggleSortKeys()
  if (state.value.isValid && content.value.trim() !== '') {
    content.value = state.value.formatted
  }
}

/** 5. Clear Data in Editor & Tree */
function handleClear() {
  content.value = ''
  clear()
}

/** Load Sample Data */
function handleLoadSample(sample: SampleDataset) {
  loadSample(sample.json)
  content.value = state.value.formatted || sample.json
}

/** 6. Copy Code (Ensures Formatted Data) */
function handleCopy(payload?: string) {
  const textToCopy = (typeof payload === 'string' && payload) ? payload : getFormattedText()
  if (!textToCopy) return
  
  copyToClipboard(textToCopy)
  treeCopied.value = true
  setTimeout(() => {
    treeCopied.value = false
  }, 1500)
}

/** 7. Download JSON Data (Ensures Formatted Data) */
function handleDownload(payload?: string) {
  const textToDownload = (typeof payload === 'string' && payload) ? payload : getFormattedText()
  if (!textToDownload) return

  downloadJson(textToDownload, 'data.json')
}

function handleClearTreeOnly() {
  isTreeCleared.value = true
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
    <!-- Header -->
    <header class="flex items-center justify-between border-b border-surface-hair bg-surface px-5 py-3">
      <div class="flex items-center gap-2.5">
        <span class="flex h-9 w-9 items-center justify-center rounded bg-key/15">
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

        <!-- Language switch -->
        <div class="flex items-center rounded border border-surface-hair p-0.5 text-xs" :aria-label="t('lang.label')">
          <button
            v-for="opt in localeOptions"
            :key="opt.code"
            type="button"
            class="rounded px-2 py-1 transition"
            :class="locale === opt.code ? 'bg-key/20 text-key' : 'text-muted hover:text-parchment'"
            :aria-pressed="locale === opt.code"
            :lang="opt.code"
            @click="handleLocaleSelect(opt.code)"
          >
            {{ opt.code.toUpperCase() }}
          </button>
        </div>

        <!-- Theme toggle -->
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded border border-surface-hair text-parchment transition hover:border-key/50 hover:text-key"
          :title="theme === 'dark' ? t('theme.toLight') : t('theme.toDark')"
          :aria-label="theme === 'dark' ? t('theme.toLight') : t('theme.toDark')"
          @click="toggleTheme"
        >
          <Sun v-if="theme === 'dark'" class="h-4 w-4" aria-hidden="true" />
          <Moon v-else class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>

    <!-- Toolbar -->
    <Toolbar
      :indent-size="options.indentSize"
      :sort-keys="options.sortKeys ?? false"
      :show-tree="showTree"
      :can-download="canDownload || (!isEmpty && liveValidation.valid)"
      :samples="sampleDatasets"
      @format="runFormat"
      @minify="runMinify"
      @clear="handleClear"
      @copy="handleCopy()"
      @download="handleDownload()"
      @load-sample="handleLoadSample"
      @toggle-tree="showTree = !showTree"
      @toggle-sort="handleSortToggle"
      @update:indent-size="handleIndentChange"
    />

    <!-- Error banner -->
    <div v-if="!isEmpty && !liveValidation.valid && liveValidation.error" class="px-4 pt-3">
      <ErrorBanner :error="liveValidation.error" />
    </div>

    <!-- Main workspace -->
    <main class="flex min-h-0 flex-1 gap-3 p-4">
      <!-- Editor Section -->
      <section
        class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-surface-hair bg-surface shadow-panel"
        :class="showTree ? 'basis-1/2' : 'basis-full'"
      >
        <div class="flex items-center justify-between border-b border-surface-hair px-3 py-1.5">
          <span class="text-[11px] uppercase tracking-wide text-muted">{{ t('editor.label') }}</span>
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

      <!-- Tree View Section -->
      <section
        v-if="showTree"
        class="flex min-h-0 basis-1/2 flex-col overflow-hidden rounded-lg border border-surface-hair bg-surface shadow-panel"
      >
        <!-- Header with Toolbar Controls -->
        <div class="flex items-center justify-between border-b border-surface-hair px-3 py-1.5">
          <div class="flex items-center gap-1.5">
            <FolderTree class="h-3.5 w-3.5 text-key" />
            <span class="text-[11px] font-medium uppercase tracking-wide text-muted">{{ t('tree.label') }}</span>
          </div>

          <div class="flex items-center gap-1">
            <button
              type="button"
              class="flex items-center gap-1 rounded border border-surface-hair px-1.5 py-0.5 text-xs text-muted transition hover:border-key/50 hover:text-key"
              title="Sort Keys"
              @click="handleSortToggle"
            >
              <ArrowUpDown class="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              class="flex items-center gap-1 rounded border border-surface-hair px-1.5 py-0.5 text-xs text-muted transition hover:border-key/50 hover:text-key"
              title="Copy Formatted JSON"
              @click="handleCopy()"
            >
              <Check v-if="treeCopied" class="h-3.5 w-3.5 text-key" />
              <Copy v-else class="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              class="flex items-center gap-1 rounded border border-surface-hair px-1.5 py-0.5 text-xs text-muted transition hover:border-key/50 hover:text-key"
              title="Download Formatted JSON"
              @click="handleDownload()"
            >
              <Download class="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              class="flex items-center gap-1 rounded border border-surface-hair px-1.5 py-0.5 text-xs text-muted transition hover:border-boolean/50 hover:text-boolean"
              title="Clear Tree Only"
              @click="handleClearTreeOnly"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-auto p-2">
          <div v-if="isTreeCleared" class="p-2 font-mono text-xs text-muted">
            Tree View cleared.
          </div>
          <TreeViewer
            v-else-if="!isEmpty && liveValidation.valid"
            :node-key="null"
            :value="parsedForTree"
            path="$"
            :depth="0"
            @copy="handleCopy"
            @download="handleDownload"
            @sort="handleSortToggle"
          />
          <p v-else class="p-2 text-xs text-muted">
            {{ isEmpty ? t('tree.emptyState') : t('tree.fixError') }}
          </p>
        </div>
      </section>
    </main>

    <!-- Toasts Notifications -->
    <div class="pointer-events-none fixed bottom-4 right-4 flex flex-col gap-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="rounded border px-3 py-2 text-xs shadow-panel"
        :class="{
          'border-string/40 bg-string/10 text-string': toast.variant === 'success',
          'border-boolean/40 bg-boolean/10 text-boolean': toast.variant === 'error',
          'border-surface-hair bg-surface-raised text-parchment': toast.variant === 'info',
        }"
      >
        {{ toast.text }}
      </div>
    </div>
  </div>
</template>