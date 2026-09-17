// utils/copyFormats.ts
// Transforms behind the Copy dropdown (<CopyMenu>): each option turns the
// source text into the shape a particular destination expects when pasted.

import { minifySql } from '~/utils/sql'

export type CopyLanguage = 'json' | 'yaml' | 'csv' | 'sql'

export type CopyFormatId = 'plain' | 'minified' | 'telegram' | 'markdown' | 'slack' | 'email' | 'escaped'

/** Telegram splits (or refuses) messages longer than this */
export const TELEGRAM_MESSAGE_LIMIT = 4096

export function canMinify(language: CopyLanguage): boolean {
  return language === 'json' || language === 'sql'
}

function minify(text: string, language: CopyLanguage): string {
  if (language === 'sql') return minifySql(text)
  try {
    return JSON.stringify(JSON.parse(text))
  } catch {
    return text
  }
}

function fence(text: string, lang = ''): string {
  return '```' + lang + '\n' + text.replace(/\n+$/, '') + '\n```'
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export interface CopyPayload {
  plain: string
  /** Rich version for apps that accept HTML (email, Word, Google Docs) */
  html?: string
}

export function buildCopyPayload(format: CopyFormatId, text: string, language: CopyLanguage): CopyPayload {
  switch (format) {
    case 'minified':
      return { plain: minify(text, language) }
    // Telegram, Discord and GitHub all render ```lang fences as code blocks
    case 'telegram':
    case 'markdown':
      return { plain: fence(text, language) }
    // Slack shows a language tag as literal text, so leave it off
    case 'slack':
      return { plain: fence(text) }
    case 'email':
      return {
        plain: text,
        html:
          '<pre style="font-family:Consolas,Menlo,monospace;font-size:13px;line-height:1.5;' +
          'background:#f6f8fa;border:1px solid #d0d7de;border-radius:6px;padding:12px;white-space:pre;">' +
          escapeHtml(text) +
          '</pre>',
      }
    case 'escaped':
      return { plain: JSON.stringify(text) }
    default:
      return { plain: text }
  }
}
