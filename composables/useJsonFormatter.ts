// composables/useJsonFormatter.ts
import { ref, computed, type Ref } from 'vue'
import type {
  EditorState,
  FormatOptions,
  ValidationError,
  ValidationResult,
  IndentSize,
} from '~/types/json'

/**
 * Extracts line/column info from a JSON.parse SyntaxError message.
 * V8's messages look like: "Unexpected token } in JSON at position 42"
 * or, on newer V8, "... in JSON at position 42 (line 3 column 1)".
 * Firefox/Safari phrase things differently; we fall back gracefully
 * to a message-only error when we can't locate a position.
 */
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

  function sortObjectKeysDeep(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map(sortObjectKeysDeep)
    }
    if (value !== null && typeof value === 'object') {
      const sorted: Record<string, unknown> = {}
      for (const k of Object.keys(value as Record<string, unknown>).sort()) {
        sorted[k] = sortObjectKeysDeep((value as Record<string, unknown>)[k])
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

  /** Formats/beautifies the given input, updates state, returns success flag */
  function format(input: string, opts: Partial<FormatOptions> = {}): boolean {
    const merged = { ...options.value, ...opts }
    const result = validate(input)
    if (!result.valid) return applyResult(input, result)

    const dataToPrint = merged.sortKeys ? sortObjectKeysDeep(result.data) : result.data
    const pretty = result.data === undefined ? '' : JSON.stringify(dataToPrint, null, merged.indentSize)
    return applyResult(input, result, pretty)
  }

  /** Minifies the given input, updates state, returns success flag */
  function minify(input: string): boolean {
    const result = validate(input)
    if (!result.valid) return applyResult(input, result)

    const compact = result.data === undefined ? '' : JSON.stringify(result.data)
    return applyResult(input, result, compact)
  }

  function setIndentSize(size: IndentSize) {
    options.value.indentSize = size
    if (state.value.isValid && state.value.raw.trim() !== '') {
      format(state.value.raw)
    }
  }

  function toggleSortKeys() {
    options.value.sortKeys = !options.value.sortKeys
    if (state.value.isValid && state.value.raw.trim() !== '') {
      format(state.value.raw)
    }
  }

  function clear() {
    state.value = {
      raw: '',
      formatted: '',
      isValid: true,
      error: null,
      isDirty: false,
    }
  }

  function loadSample(sample: string) {
    format(sample)
  }

  const canDownload = computed(() => state.value.isValid && state.value.formatted.trim() !== '')

  return {
    state,
    options,
    validate,
    format,
    minify,
    setIndentSize,
    toggleSortKeys,
    clear,
    loadSample,
    canDownload,
  }
}
