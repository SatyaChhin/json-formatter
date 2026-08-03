// composables/useHistory.ts
import { type Ref } from 'vue'

export interface HistoryEntry {
  id: string
  savedAt: number
  preview: string
  content: string
}

const STORAGE_KEY = 'json-formatter:history'
const MAX_ENTRIES = 15

/**
 * Explicit "save points" for editor documents, persisted to localStorage.
 * Saving is user-triggered (not auto-saved on every keystroke) to keep the
 * list meaningful rather than noisy.
 */
export function useHistory() {
  const entries: Ref<HistoryEntry[]> = useState<HistoryEntry[]>('json-formatter-history', () => [])

  function persist() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.value))
    } catch {
      // storage unavailable/full — history just won't persist across reloads
    }
  }

  /** Call once on client mount to restore previously saved entries */
  function initHistory() {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      entries.value = raw ? JSON.parse(raw) : []
    } catch {
      entries.value = []
    }
  }

  function save(content: string) {
    const trimmed = content.trim()
    if (!trimmed || !import.meta.client) return
    if (entries.value[0]?.content === content) return // skip consecutive duplicates

    entries.value = [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        savedAt: Date.now(),
        preview: trimmed.replace(/\s+/g, ' ').slice(0, 80),
        content,
      },
      ...entries.value,
    ].slice(0, MAX_ENTRIES)
    persist()
  }

  function remove(id: string) {
    entries.value = entries.value.filter((entry) => entry.id !== id)
    persist()
  }

  function clear() {
    entries.value = []
    persist()
  }

  return { entries, initHistory, save, remove, clear }
}
