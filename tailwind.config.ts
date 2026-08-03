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
        // `key` is the app's single UI accent (buttons, active states,
        // focus rings) — most of the UI already treats it that way.
        // `datakey` is the *other* key: the color of actual JSON property
        // names, kept separate so chrome and data never compete.
        key: {
          DEFAULT: 'rgb(var(--c-key) / <alpha-value>)',
          dim: 'rgb(var(--c-key-dim) / <alpha-value>)',
        },
        datakey: 'rgb(var(--c-datakey) / <alpha-value>)',
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
        // Resolves through --font-mono-active (see assets/css/main.css /
        // composables/useFontSettings.ts) so the user's font-family choice
        // applies everywhere font-mono is used; falls back if unset.
        mono: ['var(--font-mono-active)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
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
