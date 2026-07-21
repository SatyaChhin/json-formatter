import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  darkMode: 'class',
  content: [
    './components/**/*.{vue,js,ts}',
    './composables/**/*.{js,ts}',
    './app.vue',
  ],
  theme: {
    extend: {
      colors: {
        // Base surfaces resolve through CSS variables so light/dark share
        // the same class names (bg-ink, text-parchment, etc.) — only the
        // variable values flip in assets/css/main.css.
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          soft: 'rgb(var(--c-ink-soft) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--c-surface) / <alpha-value>)',
          raised: 'rgb(var(--c-surface-raised) / <alpha-value>)',
          hair: 'rgb(var(--c-surface-hair) / <alpha-value>)',
        },
        parchment: 'rgb(var(--c-parchment) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        // Token palette — mirrors JSON syntax highlighting, used across the
        // UI (not just inside the editor) as the app's signature color
        // system. Values also shift slightly per-theme for AA contrast.
        key: {
          DEFAULT: 'rgb(var(--c-key) / <alpha-value>)',
          dim: 'rgb(var(--c-key-dim) / <alpha-value>)',
        },
        string: {
          DEFAULT: 'rgb(var(--c-string) / <alpha-value>)',
          dim: 'rgb(var(--c-string-dim) / <alpha-value>)',
        },
        number: {
          DEFAULT: 'rgb(var(--c-number) / <alpha-value>)',
          dim: 'rgb(var(--c-number-dim) / <alpha-value>)',
        },
        boolean: {
          DEFAULT: 'rgb(var(--c-boolean) / <alpha-value>)',
          dim: 'rgb(var(--c-boolean-dim) / <alpha-value>)',
        },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['Manrope', '"Noto Sans Khmer"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        khmer: ['"Noto Sans Khmer"', 'Manrope', 'ui-sans-serif', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        lg: '10px',
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
