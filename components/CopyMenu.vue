<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { Check, ChevronDown, Code, Copy, Mail, MessageSquare, Minimize2, Quote, Send } from 'lucide-vue-next'
import { useLocale } from '~/composables/useLocale'
import { useClipboard } from '~/composables/useClipboard'
import { usePopover } from '~/composables/usePopover'
import type { TranslationKey } from '~/locales/en'
import {
  TELEGRAM_MESSAGE_LIMIT,
  buildCopyPayload,
  canMinify,
  type CopyFormatId,
  type CopyLanguage,
} from '~/utils/copyFormats'

const props = withDefaults(
  defineProps<{
    text: string
    language: CopyLanguage
    /** toolbar: labelled pill button · icon: compact icon-only button for panel headers */
    variant?: 'toolbar' | 'icon'
    /** Which edge of the trigger the menu lines up with */
    align?: 'left' | 'right'
  }>(),
  { variant: 'toolbar', align: 'left' }
)

const { t } = useLocale()
const { copyToClipboard, pushToast } = useClipboard()
const { isOpen, rootRef, toggle, close } = usePopover()

const copied = ref(false)

interface CopyOption {
  id: CopyFormatId
  labelKey: TranslationKey
  hintKey?: TranslationKey
  icon: Component
}

const groups = computed<CopyOption[][]>(() => [
  [
    { id: 'plain', labelKey: 'copy.plain', icon: Copy },
    ...(canMinify(props.language) ? [{ id: 'minified' as const, labelKey: 'copy.minified' as const, icon: Minimize2 }] : []),
  ],
  [
    { id: 'telegram', labelKey: 'copy.telegram', hintKey: 'copy.telegram.hint', icon: Send },
    { id: 'markdown', labelKey: 'copy.markdown', hintKey: 'copy.markdown.hint', icon: Code },
    { id: 'slack', labelKey: 'copy.slack', hintKey: 'copy.slack.hint', icon: MessageSquare },
    { id: 'email', labelKey: 'copy.email', hintKey: 'copy.email.hint', icon: Mail },
  ],
  [{ id: 'escaped', labelKey: 'copy.escaped', hintKey: 'copy.escaped.hint', icon: Quote }],
])

async function copyAs(option: CopyOption) {
  close()
  const payload = buildCopyPayload(option.id, props.text, props.language)
  const ok = await copyToClipboard(payload.plain, payload.html, t('copy.done', { format: t(option.labelKey) }))
  if (!ok) return
  if (option.id === 'telegram' && payload.plain.length > TELEGRAM_MESSAGE_LIMIT) {
    pushToast(t('copy.telegram.tooLong'), 'info', 5000)
  }
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1500)
}
</script>

<template>
  <div ref="rootRef" class="relative">
    <button
      v-if="variant === 'toolbar'"
      type="button"
      class="flex items-center gap-1.5 rounded-full border border-surface-hair px-3 py-1 text-sm text-parchment transition hover:border-key/50 hover:text-key"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <Check v-if="copied" class="h-4 w-4 text-key" aria-hidden="true" />
      <Copy v-else class="h-4 w-4" aria-hidden="true" />
      {{ t('toolbar.copy') }}
      <ChevronDown class="h-3.5 w-3.5" aria-hidden="true" />
    </button>
    <button
      v-else
      type="button"
      class="flex items-center gap-0.5 rounded-full border border-surface-hair px-1.5 py-0.5 text-xs text-muted transition hover:border-key/50 hover:text-key"
      :title="t('toolbar.copy')"
      :aria-label="t('toolbar.copy')"
      aria-haspopup="menu"
      :aria-expanded="isOpen"
      @click="toggle"
    >
      <Check v-if="copied" class="h-3.5 w-3.5 text-key" aria-hidden="true" />
      <Copy v-else class="h-3.5 w-3.5" aria-hidden="true" />
      <ChevronDown class="h-3 w-3" aria-hidden="true" />
    </button>

    <div
      v-if="isOpen"
      role="menu"
      class="absolute top-full z-30 mt-1 w-64 overflow-hidden rounded border border-surface-hair bg-surface-raised p-1 shadow-panel"
      :class="align === 'right' ? 'right-0' : 'left-0'"
    >
      <template v-for="(group, index) in groups" :key="index">
        <div v-if="index > 0" class="my-1 h-px bg-surface-hair" aria-hidden="true" />
        <p v-if="index === 1" class="px-2 pb-0.5 pt-1 text-[10.5px] uppercase text-muted">{{ t('copy.shareTo') }}</p>
        <button
          v-for="option in group"
          :key="option.id"
          type="button"
          role="menuitem"
          class="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left transition hover:bg-key/10 hover:text-key"
          @click="copyAs(option)"
        >
          <component :is="option.icon" class="mt-0.5 h-3.5 w-3.5 shrink-0 text-key" aria-hidden="true" />
          <span class="min-w-0">
            <span class="block text-xs text-parchment">{{ t(option.labelKey) }}</span>
            <span v-if="option.hintKey" class="block text-[10.5px] leading-snug text-muted">{{ t(option.hintKey) }}</span>
          </span>
        </button>
      </template>
    </div>
  </div>
</template>
