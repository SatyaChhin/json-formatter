<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import { useLocale } from '~/composables/useLocale'
import type { JsonValueType } from '~/types/json'

defineOptions({ name: 'TreeViewer' })

const props = withDefaults(
  defineProps<{
    nodeKey: string | number | null
    value: unknown
    path: string
    depth: number
  }>(),
  { depth: 0 }
)

const { t } = useLocale()

function typeOf(value: unknown): JsonValueType {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  const type = typeof value
  if (type === 'object') return 'object'
  if (type === 'string') return 'string'
  if (type === 'number') return 'number'
  if (type === 'boolean') return 'boolean'
  return 'string'
}

const valueType = computed(() => typeOf(props.value))
const isContainer = computed(() => valueType.value === 'object' || valueType.value === 'array')

const entries = computed<[string | number, unknown][]>(() => {
  if (!isContainer.value) return []
  if (valueType.value === 'array') {
    return (props.value as unknown[]).map((v, i) => [i, v] as [number, unknown])
  }
  return Object.entries(props.value as Record<string, unknown>)
})

// Top two levels start expanded so the shape of the document is visible immediately
const expanded = ref(props.depth < 2)

const containerLabel = computed(() => {
  if (valueType.value === 'array') return `Array(${entries.value.length})`
  return `Object(${entries.value.length})`
})

const previewClass = computed(() => {
  switch (valueType.value) {
    case 'string':
      return 'text-string'
    case 'number':
      return 'text-number'
    case 'boolean':
    case 'null':
      return 'text-boolean'
    default:
      return 'text-muted'
  }
})

const previewText = computed(() => {
  switch (valueType.value) {
    case 'string':
      return `"${props.value as string}"`
    case 'null':
      return 'null'
    default:
      return String(props.value)
  }
})
</script>

<template>
  <div>
    <div
      class="group flex cursor-pointer items-start gap-1 rounded px-1 py-0.5 font-mono text-sm hover:bg-surface-hair/40"
      :class="{ 'cursor-default': !isContainer }"
      @click="isContainer && (expanded = !expanded)"
    >
      <ChevronRight
        v-if="isContainer"
        class="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted transition-transform"
        :class="{ 'rotate-90': expanded }"
        aria-hidden="true"
      />
      <span v-else class="w-3.5 shrink-0" />

      <span v-if="nodeKey !== null" class="shrink-0 text-key">
        {{ typeof nodeKey === 'number' ? nodeKey : `"${nodeKey}"` }}<span class="text-muted">:</span>
      </span>

      <span v-if="isContainer" class="text-muted">{{ containerLabel }}</span>
      <span v-else class="break-all" :class="previewClass">{{ previewText }}</span>
    </div>

    <div v-if="isContainer && expanded" class="ml-4 border-l border-surface-hair pl-2">
      <TreeViewer
        v-for="[k, v] in entries"
        :key="k"
        :node-key="k"
        :value="v"
        :path="`${path}.${k}`"
        :depth="depth + 1"
      />
      <p v-if="entries.length === 0" class="px-1 py-0.5 font-mono text-xs text-muted">{{ t('tree.empty') }}</p>
    </div>
  </div>
</template>
