<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import { useLocale } from '~/composables/useLocale'
import type { ValidationError } from '~/types/json'

defineProps<{
  error: ValidationError
}>()

const { t } = useLocale()
</script>

<template>
  <div
    role="alert"
    class="flex items-start gap-3 rounded border border-boolean/30 bg-boolean/10 px-4 py-3 text-sm text-boolean"
  >
    <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    <div class="flex flex-col gap-0.5">
      <p class="font-medium">
        {{ t('error.title') }}
        <span v-if="error.line" class=" font-normal text-boolean/80">
          — line {{ error.line }}<template v-if="error.column">, column {{ error.column }}</template>
        </span>
      </p>
      <p class=" text-xs text-boolean/70">{{ error.message }}</p>
    </div>
  </div>
</template>
