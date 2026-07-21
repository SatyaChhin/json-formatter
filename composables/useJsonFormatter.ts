import { ref, computed, type Ref } from 'vue'
import type {
  EditorState,
  FormatOptions,
  ValidationError,
  ValidationResult,
  IndentSize,
} from '~/types/json'

function locateError(raw: string, message: string): ValidationError {
  const lineColMatch = message.match(/line (\d+) column (\d+)/i)
  if (lineColMatch) {
    return {
      message,
      line: Number(lineColMatch[1]),
      column: Number(lineColMatch[2]),
    }
  }

  const positionMatch = message.match(/position (\d+)/i)
  if (positionMatch) {
    const offset = Number(positionMatch[1])
    const upToOffset = raw.slice(0, offset)
    const line = upToOffset.split('\n').length
    const lastNewline = upToOffset.lastIndexOf('\n')
    const column = offset - lastNewline
    return { message, line, column, offset }
  }

  return { message }
}

export function useJsonFormatter() {
  const state: Ref<EditorState> = ref({
    raw: '',
    formatted: '',
    isValid: true,
    error: null,
    isDirty: false,
  })

  const options: Ref<FormatOptions> = ref({
    indentSize: 2,
    sortKeys: false,
  })

  // Computed property to extract parsed object for Tree View
  const parsedData = computed(() => {
    if (!state.value.isValid || !state.value.formatted) return null
    try {
      return JSON.parse(state.value.formatted)
    } catch {
      return null
    }
  })

  /** Pure validation — no state mutation, safe to call on every keystroke */
  function validate(input: string): ValidationResult {
    if (input.trim() === '') {
      return { valid: true, data: undefined }
    }
    try {
      const data = JSON.parse(input)
      return { valid: true, data }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid JSON'
      return { valid: false, error: locateError(input, message) }
    }
  }

  /** Recursively sorts object keys alphabetically with circular reference handling */
  function sortObjectKeysDeep(value: unknown, seen = new WeakSet()): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => sortObjectKeysDeep(item, seen))
    }

    if (value !== null && typeof value === 'object') {
      if (seen.has(value as object)) {
        return '[Circular Reference]'
      }
      seen.add(value as object)

      const sorted: Record<string, unknown> = {}
      const keys = Object.keys(value as Record<string, unknown>).sort()

      for (const k of keys) {
        sorted[k] = sortObjectKeysDeep((value as Record<string, unknown>)[k], seen)
      }
      return sorted
    }
    return value
  }

  function applyResult(input: string, result: ValidationResult, output?: string): boolean {
    state.value.raw = input
    state.value.isDirty = true

    if (!result.valid) {
      state.value.isValid = false
      state.value.error = result.error ?? null
      return false
    }

    state.value.formatted = output ?? ''
    state.value.isValid = true
    state.value.error = null
    return true
  }

  /** Formats/beautifies input, syncs state for both Editor and Tree view */
  function format(input?: string, opts: Partial<FormatOptions> = {}): boolean {
    const targetInput = input !== undefined ? input : state.value.raw
    const merged = { ...options.value, ...opts }
    const result = validate(targetInput)

    if (!result.valid) return applyResult(targetInput, result)

    const dataToPrint = merged.sortKeys ? sortObjectKeysDeep(result.data) : result.data
    const pretty = result.data === undefined ? '' : JSON.stringify(dataToPrint, null, merged.indentSize)
    return applyResult(targetInput, result, pretty)
  }

  /** Minifies the given input */
  function minify(input?: string): boolean {
    const targetInput = input !== undefined ? input : state.value.raw
    const result = validate(targetInput)
    if (!result.valid) return applyResult(targetInput, result)

    const compact = result.data === undefined ? '' : JSON.stringify(result.data)
    return applyResult(targetInput, result, compact)
  }

  /** Sorts the JSON data keys and updates views */
  function sortJsonData(): boolean {
    options.value.sortKeys = true
    return format()
  }

  /** Toggles sort keys setting and re-formats */
  function toggleSortKeys() {
    options.value.sortKeys = !options.value.sortKeys
    if (state.value.isValid && state.value.raw.trim() !== '') {
      format()
    }
  }

  function setIndentSize(size: IndentSize) {
    options.value.indentSize = size
    if (state.value.isValid && state.value.raw.trim() !== '') {
      format()
    }
  }

  /** Clears Editor text, Tree View state, and error logs */
  function clear() {
    state.value = {
      raw: '',
      formatted: '',
      isValid: true,
      error: null,
      isDirty: false,
    }
  }

  /** Copies current formatted JSON code to the system clipboard */
  async function copyCode(): Promise<boolean> {
    if (!state.value.formatted) return false
    try {
      await navigator.clipboard.writeText(state.value.formatted)
      return true
    } catch {
      return false
    }
  }

  /** Downloads the formatted JSON as a file */
  function downloadJson(filename = 'data.json') {
    if (!state.value.formatted || !state.value.isValid) return

    const blob = new Blob([state.value.formatted], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  function loadSample(sample: string) {
    format(sample)
  }

  const canDownload = computed(() => state.value.isValid && state.value.formatted.trim() !== '')

  return {
    state,
    options,
    parsedData,
    validate,
    format,
    minify,
    sortJsonData,
    toggleSortKeys,
    setIndentSize,
    clear,
    copyCode,
    downloadJson,
    loadSample,
    canDownload,
  }
}