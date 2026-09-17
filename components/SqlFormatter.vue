<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  WandSparkles,
  Minimize2,
  Copy,
  Download,
  Trash2,
  Upload,
  ArrowLeftToLine,
  TriangleAlert,
} from 'lucide-vue-next'
import type { SqlLanguage } from 'sql-formatter'
import { useLocale } from '~/composables/useLocale'
import {
  formatSql,
  minifySql,
  sqlDialectOptions,
  type SqlIndent,
  type SqlKeywordCase,
} from '~/utils/sql'

const emit = defineEmits<{
  copy: [text: string]
  download: [text: string, filename: string]
}>()

const { t } = useLocale()

const INPUT_KEY = 'json-formatter:sql-input'
const OPTIONS_KEY = 'json-formatter:sql-options'

const input = ref('')
const mode = ref<'format' | 'minify'>('format')
const dialect = ref<SqlLanguage>('sql')
const keywordCase = ref<SqlKeywordCase>('upper')
const indent = ref<SqlIndent>(2)

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDraggingFile = ref(false)
let dragDepth = 0

const keywordCaseOptions: { id: SqlKeywordCase; key: 'sql.case.upper' | 'sql.case.lower' | 'sql.case.preserve' }[] = [
  { id: 'upper', key: 'sql.case.upper' },
  { id: 'lower', key: 'sql.case.lower' },
  { id: 'preserve', key: 'sql.case.preserve' },
]
const indentOptions: SqlIndent[] = [2, 4, 'tab']

// Output re-renders live on every keystroke/option change
const result = computed(() => {
  if (mode.value === 'minify') return { ok: true as const, text: minifySql(input.value) }
  return formatSql(input.value, {
    dialect: dialect.value,
    keywordCase: keywordCase.value,
    indent: indent.value,
  })
})
const output = computed(() => (result.value.ok ? result.value.text : ''))
const isEmpty = computed(() => input.value.trim() === '')

function loadFile(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result
    if (typeof text === 'string') {
      input.value = text
      mode.value = 'format'
    }
  }
  reader.readAsText(file)
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) loadFile(file)
  target.value = ''
}

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

function useOutputAsInput() {
  if (output.value) input.value = output.value
}

function handleDownload() {
  emit('download', output.value, mode.value === 'minify' ? 'query.min.sql' : 'query.sql')
}

function handleClear() {
  input.value = ''
  mode.value = 'format'
}

onMounted(() => {
  try {
    input.value = localStorage.getItem(INPUT_KEY) ?? ''
    const saved = JSON.parse(localStorage.getItem(OPTIONS_KEY) ?? 'null')
    if (saved) {
      if (sqlDialectOptions.some((d) => d.id === saved.dialect)) dialect.value = saved.dialect
      if (keywordCaseOptions.some((k) => k.id === saved.keywordCase)) keywordCase.value = saved.keywordCase
      if (indentOptions.includes(saved.indent)) indent.value = saved.indent
    }
  } catch {
    // Storage unavailable (private mode, blocked site data) — start with defaults
  }
})

watch(input, (next) => {
  try {
    localStorage.setItem(INPUT_KEY, next)
  } catch {}
})

watch([dialect, keywordCase, indent], () => {
  try {
    localStorage.setItem(
      OPTIONS_KEY,
      JSON.stringify({ dialect: dialect.value, keywordCase: keywordCase.value, indent: indent.value })
    )
  } catch {}
})
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <!-- SQL toolbar -->
    <div class="flex flex-wrap items-center gap-2 border-b border-surface-hair bg-surface px-4 py-2.5">
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition"
        :class="mode === 'format' ? 'bg-key/90 text-ink hover:bg-key' : 'border border-surface-hair text-parchment hover:border-key/50 hover:text-key'"
        :aria-pressed="mode === 'format'"
        @click="mode = 'format'"
      >
        <WandSparkles class="h-4 w-4" aria-hidden="true" />
        {{ t('toolbar.format') }}
      </button>

      <button
        type="button"
        class="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition"
        :class="mode === 'minify' ? 'bg-key/90 text-ink hover:bg-key' : 'border border-surface-hair text-parchment hover:border-key/50 hover:text-key'"
        :aria-pressed="mode === 'minify'"
        @click="mode = 'minify'"
      >
        <Minimize2 class="h-4 w-4" aria-hidden="true" />
        {{ t('toolbar.minify') }}
      </button>

      <div class="mx-1 h-5 w-px bg-surface-hair" aria-hidden="true" />

      <label class="flex items-center gap-1.5 text-xs text-muted">
        {{ t('sql.dialect') }}
        <select
          v-model="dialect"
          class="rounded-full border border-surface-hair bg-surface-raised px-2 py-1 text-xs text-parchment focus:border-key/50 focus:outline-none"
        >
          <option v-for="opt in sqlDialectOptions" :key="opt.id" :value="opt.id">{{ opt.label }}</option>
        </select>
      </label>

      <div class="flex items-center gap-1.5 text-xs text-muted">
        <span>{{ t('sql.keywordCase') }}</span>
        <div class="flex items-center rounded-full border border-surface-hair p-0.5">
          <button
            v-for="opt in keywordCaseOptions"
            :key="opt.id"
            type="button"
            class="rounded-full px-2 py-0.5 transition"
            :class="keywordCase === opt.id ? 'bg-key/20 text-key' : 'text-muted hover:text-parchment'"
            :aria-pressed="keywordCase === opt.id"
            @click="keywordCase = opt.id"
          >
            {{ t(opt.key) }}
          </button>
        </div>
      </div>

      <div class="flex items-center gap-1.5 text-xs text-muted">
        <span>{{ t('sql.indent') }}</span>
        <div class="flex items-center rounded-full border border-surface-hair p-0.5">
          <button
            v-for="opt in indentOptions"
            :key="opt"
            type="button"
            class="rounded-full px-2 py-0.5 transition"
            :class="indent === opt ? 'bg-key/20 text-key' : 'text-muted hover:text-parchment'"
            :aria-pressed="indent === opt"
            @click="indent = opt"
          >
            {{ opt === 'tab' ? t('sql.indent.tab') : `${opt}sp` }}
          </button>
        </div>
      </div>

      <div class="mx-1 h-5 w-px bg-surface-hair" aria-hidden="true" />

      <button
        type="button"
        class="flex items-center gap-1.5 rounded-full border border-surface-hair px-3 py-1 text-sm text-parchment transition hover:border-key/50 hover:text-key"
        @click="emit('copy', output)"
      >
        <Copy class="h-4 w-4" aria-hidden="true" />
        {{ t('toolbar.copy') }}
      </button>

      <button
        type="button"
        class="flex items-center gap-1.5 rounded-full border border-surface-hair px-3 py-1 text-sm text-parchment transition enabled:hover:border-key/50 enabled:hover:text-key disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!output"
        @click="handleDownload"
      >
        <Download class="h-4 w-4" aria-hidden="true" />
        {{ t('toolbar.download') }}
      </button>

      <button
        type="button"
        class="flex items-center gap-1.5 rounded-full border border-surface-hair px-3 py-1 text-sm text-parchment transition hover:border-boolean/50 hover:text-boolean"
        @click="handleClear"
      >
        <Trash2 class="h-4 w-4" aria-hidden="true" />
        {{ t('toolbar.clearall') }}
      </button>
    </div>

    <main class="flex min-h-0 flex-1 flex-col gap-3 p-4 md:flex-row">
      <!-- Input -->
      <section
        class="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-surface-hair bg-surface shadow-panel"
        @dragenter.prevent="handleDragEnter"
        @dragover.prevent
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <div class="flex items-center justify-between border-b border-surface-hair px-3 py-1.5">
          <span class="text-[11px] uppercase text-muted">{{ t('sql.input') }}</span>
          <input ref="fileInputRef" type="file" accept=".sql,.txt" class="hidden" @change="handleFileChange" />
          <button
            type="button"
            class="flex items-center gap-1 rounded-full border border-surface-hair bg-surface-raised px-2 py-0.5 text-[11px] text-parchment transition hover:border-key/50 hover:text-key"
            @click="fileInputRef?.click()"
          >
            <Upload class="h-3 w-3 text-key" aria-hidden="true" />
            {{ t('sql.upload') }}
          </button>
        </div>
        <div class="min-h-0 flex-1">
          <ClientOnly>
            <JsonEditor v-model="input" language="sql" />
            <template #fallback>
              <div class="flex h-full items-center justify-center text-xs text-muted">{{ t('editor.loading') }}</div>
            </template>
          </ClientOnly>
        </div>
        <div
          v-if="isDraggingFile"
          class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed border-key bg-ink/80"
        >
          <span class="flex items-center gap-2 text-sm font-medium text-key">
            <Upload class="h-4 w-4" aria-hidden="true" />
            {{ t('sql.drop') }}
          </span>
        </div>
      </section>

      <!-- Output -->
      <section class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-surface-hair bg-surface shadow-panel">
        <div class="flex items-center justify-between border-b border-surface-hair px-3 py-1.5">
          <span class="text-[11px] uppercase text-muted">
            {{ mode === 'minify' ? t('sql.outputMinified') : t('sql.output') }}
          </span>
          <button
            type="button"
            class="flex items-center gap-1 rounded-full border border-surface-hair bg-surface-raised px-2 py-0.5 text-[11px] text-parchment transition enabled:hover:border-key/50 enabled:hover:text-key disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="!output"
            @click="useOutputAsInput"
          >
            <ArrowLeftToLine class="h-3 w-3 text-key" aria-hidden="true" />
            {{ t('sql.useOutput') }}
          </button>
        </div>

        <div v-if="!result.ok" class="flex items-start gap-2 border-b border-boolean/30 bg-boolean/10 px-3 py-2 text-xs text-boolean">
          <TriangleAlert class="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <div class="min-w-0">
            <p class="font-medium">{{ t('sql.error') }}</p>
            <p class="mt-0.5 whitespace-pre-wrap break-words font-mono text-[11px] opacity-90">{{ result.error }}</p>
          </div>
        </div>

        <div class="min-h-0 flex-1">
          <p v-if="isEmpty" class="p-4 text-xs text-muted">{{ t('sql.emptyState') }}</p>
          <ClientOnly v-else-if="output">
            <JsonEditor :model-value="output" language="sql" read-only />
          </ClientOnly>
        </div>
      </section>
    </main>
  </div>
</template>
