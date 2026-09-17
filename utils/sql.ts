// utils/sql.ts
// Helpers for the SQL formatter tool. Formatting itself is delegated to the
// `sql-formatter` library; minify is hand-rolled because the library has none.

import { format, type SqlLanguage, type KeywordCase } from 'sql-formatter'

export type SqlKeywordCase = KeywordCase
export type SqlIndent = 2 | 4 | 'tab'

export interface SqlDialectOption {
  id: SqlLanguage
  label: string
}

export const sqlDialectOptions: SqlDialectOption[] = [
  { id: 'sql', label: 'Standard SQL' },
  { id: 'postgresql', label: 'PostgreSQL' },
  { id: 'mysql', label: 'MySQL' },
  { id: 'mariadb', label: 'MariaDB' },
  { id: 'transactsql', label: 'SQL Server (T-SQL)' },
  { id: 'plsql', label: 'Oracle PL/SQL' },
  { id: 'sqlite', label: 'SQLite' },
  { id: 'bigquery', label: 'BigQuery' },
  { id: 'snowflake', label: 'Snowflake' },
  { id: 'redshift', label: 'Redshift' },
  { id: 'db2', label: 'DB2' },
  { id: 'hive', label: 'Hive' },
  { id: 'spark', label: 'Spark' },
  { id: 'trino', label: 'Trino / Presto' },
  { id: 'clickhouse', label: 'ClickHouse' },
  { id: 'duckdb', label: 'DuckDB' },
]

export interface SqlFormatOptions {
  dialect: SqlLanguage
  keywordCase: SqlKeywordCase
  indent: SqlIndent
}

export type SqlFormatResult = { ok: true; text: string } | { ok: false; error: string }

export function formatSql(source: string, opts: SqlFormatOptions): SqlFormatResult {
  if (!source.trim()) return { ok: true, text: '' }
  try {
    const text = format(source, {
      language: opts.dialect,
      keywordCase: opts.keywordCase,
      useTabs: opts.indent === 'tab',
      tabWidth: opts.indent === 'tab' ? 2 : opts.indent,
      linesBetweenQueries: 1,
    })
    return { ok: true, text }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Collapses SQL onto a single line. Whitespace inside string literals and
 * quoted identifiers is preserved; `-- line comments` are rewritten as
 * block comments so they don't swallow the rest of the query.
 */
export function minifySql(source: string): string {
  let out = ''
  let pendingSpace = false
  let i = 0

  const push = (chunk: string) => {
    if (pendingSpace && out && !/[\s(,]$/.test(out) && !/^[),;]/.test(chunk)) out += ' '
    pendingSpace = false
    out += chunk
  }

  while (i < source.length) {
    const ch = source.charAt(i)
    const next = source.charAt(i + 1)

    if (/\s/.test(ch)) {
      pendingSpace = true
      i++
      continue
    }

    // -- line comment → /* block comment */
    if (ch === '-' && next === '-') {
      const end = source.indexOf('\n', i)
      const body = source.slice(i + 2, end === -1 ? source.length : end).trim()
      if (body) push(`/* ${body.replace(/\*\//g, '* /')} */`)
      pendingSpace = true
      i = end === -1 ? source.length : end
      continue
    }

    // /* block comment */
    if (ch === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2)
      const stop = end === -1 ? source.length : end + 2
      push(source.slice(i, stop))
      pendingSpace = true
      i = stop
      continue
    }

    // Quoted strings / identifiers — copy verbatim, handling doubled-quote escapes
    const closer = ch === "'" || ch === '"' || ch === '`' ? ch : ch === '[' ? ']' : null
    if (closer) {
      let j = i + 1
      while (j < source.length) {
        if (source[j] === '\\' && ch !== '[') {
          j += 2
          continue
        }
        if (source[j] === closer) {
          if (source[j + 1] === closer && ch !== '[') {
            j += 2
            continue
          }
          break
        }
        j++
      }
      push(source.slice(i, j + 1))
      i = j + 1
      continue
    }

    push(ch)
    i++
  }

  return out.trim()
}
