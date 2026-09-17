<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { Download, X } from 'lucide-vue-next'
import { useLocale } from '~/composables/useLocale'
import { useDownloadDialog } from '~/composables/useDownloadDialog'

const { t } = useLocale()
const { state, confirm, cancel } = useDownloadDialog()

const draft = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

watch(
  () => state.value.open,
  async (open) => {
    if (!open) return
    draft.value = state.value.baseName
    await nextTick()
    inputRef.value?.focus()
    inputRef.value?.select()
  }
)

function submit() {
  confirm(draft.value)
}
</script>

<template>
  <div
    v-if="state.open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
    @mousedown.self="cancel"
    @keydown.esc="cancel"
  >
    <form
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-dialog-title"
      class="w-full max-w-sm rounded-lg border border-surface-hair bg-surface-raised shadow-panel"
      @submit.prevent="submit"
    >
      <div class="flex items-center justify-between border-b border-surface-hair px-4 py-2.5">
        <h2 id="download-dialog-title" class="flex items-center gap-2 text-sm font-semibold text-parchment">
          <Download class="h-4 w-4 text-key" aria-hidden="true" />
          {{ t('download.title') }}
        </h2>
        <button type="button" class="rounded-full p-0.5 text-muted transition hover:text-key" :aria-label="t('download.cancel')" @click="cancel">
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div class="px-4 py-4">
        <label for="download-filename" class="mb-1.5 block text-[11px] uppercase text-muted">{{ t('download.filename') }}</label>
        <div class="flex items-stretch overflow-hidden rounded border border-surface-hair bg-surface focus-within:border-key/60">
          <input
            id="download-filename"
            ref="inputRef"
            v-model="draft"
            type="text"
            spellcheck="false"
            autocomplete="off"
            class="min-w-0 flex-1 bg-transparent px-2.5 py-1.5 font-mono text-sm text-parchment focus:outline-none"
          />
          <span v-if="state.extension" class="flex items-center border-l border-surface-hair bg-surface-raised px-2.5 font-mono text-sm text-muted">
            {{ state.extension }}
          </span>
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t border-surface-hair px-4 py-2.5">
        <button
          type="button"
          class="rounded-full border border-surface-hair px-3 py-1 text-sm text-parchment transition hover:border-key/50 hover:text-key"
          @click="cancel"
        >
          {{ t('download.cancel') }}
        </button>
        <button
          type="submit"
          class="flex items-center gap-1.5 rounded-full bg-key/90 px-3 py-1 text-sm font-medium text-ink transition hover:bg-key"
        >
          <Download class="h-4 w-4" aria-hidden="true" />
          {{ t('download.confirm') }}
        </button>
      </div>
    </form>
  </div>
</template>
