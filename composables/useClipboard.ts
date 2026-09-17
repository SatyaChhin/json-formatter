// composables/useClipboard.ts
import { useLocale } from '~/composables/useLocale'
import { useDownloadDialog } from '~/composables/useDownloadDialog'
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
  const { requestFilename } = useDownloadDialog()
  // Shared so any component (e.g. <CopyMenu>) can raise toasts rendered by app.vue
  const toasts = useState<ToastMessage[]>('toasts', () => [])

  function pushToast(text: string, variant: ToastMessage['variant'] = 'info', durationMs = 2400) {
    const id = ++toastCounter
    toasts.value.push({ id, text, variant })
    setTimeout(() => {
      toasts.value = toasts.value.filter((toast) => toast.id !== id)
    }, durationMs)
  }

  async function copyToClipboard(text: string, html?: string, successMessage = t('toast.copied')): Promise<boolean> {
    if (!text.trim()) {
      pushToast(t('toast.copyEmpty'), 'info')
      return false
    }
    try {
      if (html && typeof ClipboardItem !== 'undefined') {
        // Rich copy: apps that understand HTML paste the styled version, others get plain text
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' }),
          }),
        ])
      } else {
        await navigator.clipboard.writeText(text)
      }
      pushToast(successMessage, 'success')
      return true
    } catch {
      pushToast(t('toast.copyFailed'), 'error')
      return false
    }
  }

  async function downloadJson(text: string, defaultFilename = 'data.json', mimeType = 'application/json') {
    if (!text.trim()) {
      pushToast(t('toast.downloadEmpty'), 'info')
      return
    }
    // Let the user rename the file first; null means they cancelled
    const filename = await requestFilename(defaultFilename)
    if (!filename) return
    const blob = new Blob([text], { type: mimeType })
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
