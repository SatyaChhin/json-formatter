<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ShieldCheck, ShieldX } from 'lucide-vue-next'
import { validateAgainstSchema } from '~/utils/schema'

const props = defineProps<{
  data: unknown
  hasData: boolean
}>()

const STORAGE_KEY = 'json-formatter:schema'
const schemaText = ref('')

if (import.meta.client) {
  try {
    schemaText.value = localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    // localStorage unavailable (e.g. private mode) — schema just won't persist
  }
}

watch(schemaText, (next) => {
  if (!import.meta.client) return
  try {
    if (next) localStorage.setItem(STORAGE_KEY, next)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore persistence failures
  }
})

const result = computed(() => {
  if (!props.hasData || !schemaText.value.trim()) return null
  return validateAgainstSchema(props.data, schemaText.value)
})
</script>

<template>
  <div class="flex h-full flex-col gap-2 p-2">
    <div class="flex items-center justify-between font-mono">
      <span class="text-[11px] uppercase tracking-wide text-muted">JSON Schema</span>
      <span
        v-if="result"
        class="flex items-center gap-1 text-[11px] font-medium"
        :class="result.valid ? 'text-string' : 'text-boolean'"
      >
        <ShieldCheck v-if="result.valid" class="h-3.5 w-3.5" aria-hidden="true" />
        <ShieldX v-else class="h-3.5 w-3.5" aria-hidden="true" />
        {{ result.valid ? 'Matches schema' : `${result.errors.length} error(s)` }}
      </span>
    </div>

    <textarea
      v-model="schemaText"
      placeholder='Paste a JSON Schema, e.g. { "type": "object", "required": ["id"] }'
      spellcheck="false"
      class="min-h-[120px] flex-1 resize-none rounded border border-surface-hair bg-surface-raised p-2 font-mono text-xs text-parchment placeholder-muted/50 focus:border-key/50 focus:outline-none"
    />

    <p v-if="!hasData" class="text-xs text-muted">
      Paste valid JSON in the editor to validate it against a schema.
    </p>
    <ul
      v-else-if="result && !result.valid"
      class="max-h-40 flex-none overflow-auto rounded border border-boolean/30 bg-boolean/5 p-2 font-mono text-xs text-boolean"
    >
      <li v-for="(err, idx) in result.errors" :key="idx" class="py-0.5">{{ err }}</li>
    </ul>
  </div>
</template>
