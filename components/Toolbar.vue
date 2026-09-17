<script setup lang="ts">
import {
  WandSparkles,
  Minimize2,
  Trash2,
  Download,
  FileJson,
  ListTree,
  ChevronDown,
  Quote,
  Eraser,
  SlidersHorizontal,
  Check,
} from 'lucide-vue-next'
import { useLocale } from '~/composables/useLocale'
import { usePopover } from '~/composables/usePopover'
import type { IndentSize, SampleDataset } from '~/types/json'
import type { CopyLanguage } from '~/utils/copyFormats'

const props = defineProps<{
  indentSize: IndentSize
  sortKeys: boolean
  showTree: boolean
  canDownload: boolean
  samples: SampleDataset[]
  copyText: string
  copyLanguage: CopyLanguage
}>()

const emit = defineEmits<{
  format: []
  minify: []
  clear: []
  download: []
  'load-sample': [sample: SampleDataset]
  'toggle-tree': []
  'toggle-sort': []
  'update:indentSize': [size: IndentSize]
  escape: []
  unescape: []
}>()

const { t } = useLocale()
const { isOpen: sampleMenuOpen, rootRef: sampleMenuRef } = usePopover()
const { isOpen: transformMenuOpen, rootRef: transformMenuRef } = usePopover()

function pickSample(sample: SampleDataset) {
  emit('load-sample', sample)
  sampleMenuOpen.value = false
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 border-b border-surface-hair bg-surface px-4 py-2.5">
    <!-- Primary actions -->
    <button
      type="button"
      class="flex items-center gap-1.5 rounded-full bg-key/90 px-3 py-1 text-sm font-medium text-ink transition hover:bg-key"
      @click="emit('format')"
    >
      <WandSparkles class="h-4 w-4" aria-hidden="true" />
      {{ t('toolbar.format') }}
    </button>

    <button
      type="button"
      class="flex items-center gap-1.5 rounded-full border border-surface-hair px-3 py-1 text-sm font-medium text-parchment transition hover:border-key/50 hover:text-key"
      @click="emit('minify')"
    >
      <Minimize2 class="h-4 w-4" aria-hidden="true" />
      {{ t('toolbar.minify') }}
    </button>

    <!-- Transform: indent, sort, escape/unescape — grouped out of the primary row -->
    <div ref="transformMenuRef" class="relative">
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-full border border-surface-hair px-3 py-1 text-sm text-parchment transition hover:border-key/50 hover:text-key"
        :aria-expanded="transformMenuOpen"
        @click="transformMenuOpen = !transformMenuOpen"
      >
        <SlidersHorizontal class="h-4 w-4" aria-hidden="true" />
        Transform
        <ChevronDown class="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <div
        v-if="transformMenuOpen"
        class="absolute left-0 top-full z-20 mt-1 w-64 rounded border border-surface-hair bg-surface-raised p-2 shadow-panel"
      >
        <div class="flex items-center justify-between px-1 py-1">
          <span class="text-[10.5px] uppercase tracking-wide text-muted">Indent</span>
          <div class="flex items-center rounded-full border border-surface-hair p-0.5 text-xs">
            <button
              v-for="size in [2, 4] as IndentSize[]"
              :key="size"
              type="button"
              class="rounded-full px-2 py-1 transition"
              :class="props.indentSize === size ? 'bg-key/20 text-key' : 'text-muted hover:text-parchment'"
              :aria-pressed="props.indentSize === size"
              @click="emit('update:indentSize', size)"
            >
              {{ size }}sp
            </button>
          </div>
        </div>

        <button
          type="button"
          class="flex w-full items-center justify-between rounded-full px-1.5 py-1 text-xs text-parchment transition hover:bg-key/10 hover:text-key"
          :aria-pressed="props.sortKeys"
          @click="emit('toggle-sort')"
        >
          {{ t('toolbar.sortKeys') }}
          <Check v-if="props.sortKeys" class="h-3.5 w-3.5 text-key" aria-hidden="true" />
        </button>

        <div class="my-1 h-px bg-surface-hair" aria-hidden="true" />

        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-full px-1.5 py-1 text-left text-xs text-parchment transition hover:bg-key/10 hover:text-key"
          @click="emit('escape'); transformMenuOpen = false"
        >
          <Quote class="h-3.5 w-3.5" aria-hidden="true" />
          {{ t('toolbar.escape') }}
        </button>

        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-full px-1.5 py-1 text-left text-xs text-parchment transition hover:bg-key/10 hover:text-key"
          @click="emit('unescape'); transformMenuOpen = false"
        >
          <Eraser class="h-3.5 w-3.5" aria-hidden="true" />
          {{ t('toolbar.unescape') }}
        </button>
      </div>
    </div>

    <div class="mx-1 h-5 w-px bg-surface-hair" aria-hidden="true" />

    <!-- Sample loader -->
    <div ref="sampleMenuRef" class="relative">
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-full border border-surface-hair px-3 py-1 text-sm text-parchment transition hover:border-key/50 hover:text-key"
        :aria-expanded="sampleMenuOpen"
        @click="sampleMenuOpen = !sampleMenuOpen"
      >
        <FileJson class="h-4 w-4" aria-hidden="true" />
        {{ t('toolbar.loadSample') }}
        <ChevronDown class="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <div
        v-if="sampleMenuOpen"
        class="absolute left-0 top-full z-20 mt-1 w-56 overflow-hidden rounded border border-surface-hair bg-surface-raised p-1 shadow-panel"
      >
        <button
          v-for="sample in props.samples"
          :key="sample.id"
          type="button"
          class="block w-full px-3 py-2 text-left text-sm text-parchment transition hover:bg-key/10 hover:text-key rounded-full"
          @click="pickSample(sample)"
        >
          {{ sample.label }}
        </button>
      </div>
    </div>

    <CopyMenu :text="props.copyText" :language="props.copyLanguage" />

    <button
      type="button"
      class="flex items-center gap-1.5 rounded-full border border-surface-hair px-3 py-1 text-sm text-parchment transition enabled:hover:border-key/50 enabled:hover:text-key disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="!props.canDownload"
      @click="emit('download')"
    >
      <Download class="h-4 w-4" aria-hidden="true" />
      {{ t('toolbar.download') }}
    </button>

    <button
      type="button"
      class="flex items-center gap-1.5 rounded-full border border-surface-hair px-3 py-1 text-sm text-parchment transition hover:border-boolean/50 hover:text-boolean"
      @click="emit('clear')"
    >
      <Trash2 class="h-4 w-4" aria-hidden="true" />
      {{ t('toolbar.clearall') }}
    </button>

    <div class="grow" />

    <!-- Tree view toggle -->
    <button
      type="button"
      class="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition"
      :class="props.showTree ? 'bg-key/20 text-key' : 'border border-surface-hair text-parchment hover:border-key/50 hover:text-key'"
      :aria-pressed="props.showTree"
      @click="emit('toggle-tree')"
    >
      <ListTree class="h-4 w-4" aria-hidden="true" />
      {{ t('toolbar.treeView') }}
    </button>
  </div>
</template>
