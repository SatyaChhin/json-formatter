<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import type { JsonValueType } from '~/types/json'

defineOptions({ name: 'TreeViewer' })

const props = withDefaults(
  defineProps<{
    nodeKey: string | number | null
    value: unknown
    path: string
    depth: number
    isLast?: boolean
  }>(),
  { depth: 0, isLast: true }
)

const emit = defineEmits<{
  copy: [jsonString?: string]
  download: [jsonString?: string]
  sort: []
}>()

function typeOf(val: unknown): JsonValueType {
  if (val === null) return 'null'
  if (Array.isArray(val)) return 'array'
  const type = typeof val
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

const expanded = ref(true)
const isArrayItem = computed(() => typeof props.nodeKey === 'number')

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

function getFormattedJson(): string {
  if (props.value === undefined || props.value === null) return ''
  try {
    return JSON.stringify(props.value, null, 2)
  } catch {
    return ''
  }
}

function handleNodeCopy(e?: Event) {
  if (e) e.stopPropagation()
  const formatted = getFormattedJson()
  emit('copy', formatted)
}

function handleNodeDownload(e?: Event) {
  if (e) e.stopPropagation()
  const formatted = getFormattedJson()
  emit('download', formatted)
}
</script>

<template>
  <div>
    <!-- Root Level Opening Bracket (Depth 0) -->
    <div v-if="depth === 0" class="px-1 font-mono text-sm text-muted">
      {{ valueType === 'array' ? '[' : '{' }}
    </div>

    <!-- Depth > 0 Nodes -->
    <div
      v-if="depth > 0"
      class="group flex cursor-pointer items-start gap-1 rounded px-1 py-0.5 font-mono text-sm hover:bg-surface-hair/40"
      :class="{ 'cursor-default': !isContainer }"
      @click="isContainer && (expanded = !expanded)"
    >
      <ChevronRight
        v-if="isContainer && entries.length > 0"
        class="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted transition-transform"
        :class="{ 'rotate-90': expanded }"
        aria-hidden="true"
      />
      <span v-else class="w-3.5 shrink-0" />

      <!-- Key Name -->
      <span v-if="nodeKey !== null && !isArrayItem" class="shrink-0 text-key">
        "{{ nodeKey }}":
      </span>

      <!-- Empty Container -->
      <span v-if="isContainer && entries.length === 0" class="text-muted">
        {{ valueType === 'array' ? '[]' : '{}' }}<span v-if="!isLast">,</span>
      </span>

      <!-- Opening Bracket for Container -->
      <span v-else-if="isContainer" class="text-muted">
        {{ valueType === 'array' ? '[' : '{' }}
      </span>

      <!-- Primitive Value -->
      <span v-else class="break-all" :class="previewClass">
        {{ previewText }}<span v-if="!isLast" class="text-muted">,</span>
      </span>
    </div>

    <!-- Recursive Children -->
    <div 
      v-if="isContainer && expanded && entries.length > 0" 
      class="ml-4 border-l border-surface-hair/30 pl-2"
    >
      <TreeViewer
        v-for="([k, v], index) in entries"
        :key="k"
        :node-key="k"
        :value="v"
        :path="`${path}.${k}`"
        :depth="depth + 1"
        :is-last="index === entries.length - 1"
        @copy="(val) => emit('copy', val)"
        @download="(val) => emit('download', val)"
        @sort="emit('sort')"
      />
    </div>

    <!-- Closing Bracket for Child Containers -->
    <div 
      v-if="depth > 0 && isContainer && entries.length > 0 && expanded" 
      class="ml-4 px-1 font-mono text-sm text-muted"
    >
      {{ valueType === 'array' ? ']' : '}' }}<span v-if="!isLast">,</span>
    </div>

    <!-- Root Level Closing Bracket (Depth 0) -->
    <div v-if="depth === 0" class="px-1 font-mono text-sm text-muted">
      {{ valueType === 'array' ? ']' : '}' }}
    </div>
  </div>
</template>