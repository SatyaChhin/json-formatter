// utils/convert.ts
import * as yaml from 'js-yaml'

/** Converts a parsed JSON value to a YAML string. */
export function jsonToYaml(data: unknown): string {
  if (data === undefined) return ''
  return yaml.dump(data, { indent: 2, lineWidth: -1 })
}

/** Parses a YAML string back into a JS value (throws on invalid YAML). */
export function yamlToJson(source: string): unknown {
  return yaml.load(source)
}

function csvEscapeCell(value: unknown): string {
  const text =
    value === null || value === undefined
      ? ''
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value)

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

/**
 * Converts tabular rows (as already produced for the Table view) into a CSV
 * string. Cell values that are themselves objects/arrays are inlined as
 * compact JSON, since CSV has no native concept of nesting.
 */
export function rowsToCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  if (headers.length === 0) return ''
  const lines = [headers.map(csvEscapeCell).join(',')]
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscapeCell(row[header])).join(','))
  }
  return lines.join('\n')
}
