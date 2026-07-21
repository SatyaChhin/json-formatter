// types/json.ts

/** Supported indentation widths for formatting */
export type IndentSize = 2 | 4

/** Options controlling how JSON is formatted */
export interface FormatOptions {
  indentSize: IndentSize
  sortKeys?: boolean
}

/** A single validation error surfaced to the UI */
export interface ValidationError {
  message: string
  /** 1-indexed line number, undefined if it couldn't be determined */
  line?: number
  /** 1-indexed column number, undefined if it couldn't be determined */
  column?: number
  /** Raw character offset in the source string, if available */
  offset?: number
}

/** Result of attempting to parse/validate a JSON string */
export interface ValidationResult {
  valid: boolean
  error?: ValidationError
  /** Parsed value, only present when valid is true */
  data?: unknown
}

/** Current state of the editor, held by the composable */
export interface EditorState {
  raw: string
  formatted: string
  isValid: boolean
  error: ValidationError | null
  isDirty: boolean
}

export type JsonValueType =
  | 'object'
  | 'array'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'

/** Node shape used internally by the Tree View renderer */
export interface JsonTreeNode {
  key: string | number | null
  value: unknown
  type: JsonValueType
  path: string
  children?: JsonTreeNode[]
}

/** Toast/notification payload used by toolbar actions */
export interface ToastMessage {
  id: number
  text: string
  variant: 'success' | 'error' | 'info'
}

/** A named sample dataset offered by the "Load Sample" action */
export interface SampleDataset {
  id: string
  label: string
  json: string
}
