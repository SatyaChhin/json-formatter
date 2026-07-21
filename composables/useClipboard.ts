// composables/useClipboard.ts
import { ref, type Ref } from 'vue'
import { useLocale } from '~/composables/useLocale'
import type { ToastMessage } from '~/types/json'

let toastCounter = 0

/**
 * Small shared-state composable for clipboard actions and transient toast
 * notifications. Deliberately simple — no external UI library dependency.
 * Messages are resolved through useLocale() so toasts follow the active
 * language automatically.
 */
export function useClipboard() {
  const { t } = useLocale()
  const toasts: Ref<ToastMessage[]> = ref([])

  function pushToast(text: string, variant: ToastMessage['variant'] = 'info', durationMs = 2400) {
    const id = ++toastCounter
    toasts.value.push({ id, text, variant })
    setTimeout(() => {
      toasts.value = toasts.value.filter((toast) => toast.id !== id)
    }, durationMs)
  }

  async function copyToClipboard(text: string): Promise<boolean> {
    if (!text.trim()) {
      pushToast(t('toast.copyEmpty'), 'info')
      return false
    }
    try {
      await navigator.clipboard.writeText(text)
      pushToast(t('toast.copied'), 'success')
      return true
    } catch {
      pushToast(t('toast.copyFailed'), 'error')
      return false
    }
  }

  function downloadJson(text: string, filename = 'data.json') {
    if (!text.trim()) {
      pushToast(t('toast.downloadEmpty'), 'info')
      return
    }
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    pushToast(t('toast.downloaded', { filename }), 'success')
  }

  return {
    toasts,
    pushToast,
    copyToClipboard,
    downloadJson,
  }
}
