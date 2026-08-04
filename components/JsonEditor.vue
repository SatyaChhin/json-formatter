<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import loader from '@monaco-editor/loader'
import type * as Monaco from 'monaco-editor'
import { useTheme } from '~/composables/useTheme'
import { useFontSettings } from '~/composables/useFontSettings'
import { useCodeColorScheme } from '~/composables/useCodeColorScheme'
import type { CodeColorScheme } from '~/types/i18n'

const props = withDefaults(
  defineProps<{
    modelValue: string
    readOnly?: boolean
  }>(),
  { readOnly: false }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { theme } = useTheme()
const { fontFamilyStack, fontSize } = useFontSettings()
const { codeColorScheme } = useCodeColorScheme()

const containerRef = ref<HTMLDivElement | null>(null)
const editorRef = shallowRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
let monacoApi: typeof Monaco | null = null
let resizeObserver: ResizeObserver | null = null
// Guards against feedback loops when we push external changes into the editor
let applyingExternalValue = false

const DARK_THEME = 'json-formatter-ink'
const LIGHT_THEME = 'json-formatter-paper'

function themeName(t: 'light' | 'dark') {
  return t === 'light' ? LIGHT_THEME : DARK_THEME
}

// Mirrors the --c-string/number/boolean/datakey values in assets/css/main.css
// for each CodeColorScheme — duplicated here (rather than read from CSS vars)
// because Monaco's defineTheme requires literal hex, not custom properties.
const CODE_SCHEME_HEX: Record<CodeColorScheme, { dark: SchemeHex; light: SchemeHex }> = {
  classic: {
    dark: { key: '8FAEC9', value: '94BE8C', number: 'D9B36C', keyword: 'C98A7E' },
    light: { key: '3F6E92', value: '4C7F46', number: '9C7423', keyword: 'A85246' },
  },
  ocean: {
    dark: { key: '5B8DBE', value: '6EC6C0', number: '7EB6E0', keyword: 'B39DDB' },
    light: { key: '33587A', value: '2F8F87', number: '2E6DA4', keyword: '7A5FB0' },
  },
  sunset: {
    dark: { key: 'C97A3D', value: 'E58B76', number: 'E0A458', keyword: 'D97EA3' },
    light: { key: '8A5423', value: 'B8563C', number: 'A66A1E', keyword: 'A83E68' },
  },
  mono: {
    dark: { key: '9AA7B0', value: 'B9C2B0', number: 'C7B98F', keyword: 'B79A95' },
    light: { key: '47555F', value: '5C6B54', number: '6B5F3E', keyword: '6B4F49' },
  },
}

interface SchemeHex {
  key: string
  value: string
  number: string
  keyword: string
}

function defineCustomThemes(monaco: typeof Monaco, scheme: CodeColorScheme) {
  const hex = CODE_SCHEME_HEX[scheme]

  monaco.editor.defineTheme(DARK_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: hex.dark.key },
      { token: 'string.value.json', foreground: hex.dark.value },
      { token: 'number.json', foreground: hex.dark.number },
      { token: 'keyword.json', foreground: hex.dark.keyword }, // true / false / null
      { token: 'delimiter.bracket.json', foreground: '8A939A' },
      { token: 'delimiter.array.json', foreground: '8A939A' },
      { token: 'delimiter.comma.json', foreground: '8A939A' },
    ],
    colors: {
      'editor.background': '#14181A',
      'editor.foreground': '#ECE7DC',
      'editor.lineHighlightBackground': '#212830',
      'editorLineNumber.foreground': '#4B5459',
      'editorLineNumber.activeForeground': '#8A939A',
      'editorCursor.foreground': '#E8A33D',
      'editor.selectionBackground': '#E8A33D33',
      'editorGutter.background': '#14181A',
      'scrollbarSlider.background': '#2B333866',
      'scrollbarSlider.hoverBackground': '#2B333899',
    },
  })

  monaco.editor.defineTheme(LIGHT_THEME, {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: hex.light.key },
      { token: 'string.value.json', foreground: hex.light.value },
      { token: 'number.json', foreground: hex.light.number },
      { token: 'keyword.json', foreground: hex.light.keyword },
      { token: 'delimiter.bracket.json', foreground: '5B6266' },
      { token: 'delimiter.array.json', foreground: '5B6266' },
      { token: 'delimiter.comma.json', foreground: '5B6266' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#171A1B',
      'editor.lineHighlightBackground': '#F7F7F3',
      'editorLineNumber.foreground': '#C3C8BF',
      'editorLineNumber.activeForeground': '#5B6266',
      'editorCursor.foreground': '#B5691A',
      'editor.selectionBackground': '#B5691A22',
      'editorGutter.background': '#FFFFFF',
      'scrollbarSlider.background': '#D9DCD366',
      'scrollbarSlider.hoverBackground': '#D9DCD399',
    },
  })
}

onMounted(async () => {
  const monaco = await loader.init()
  monacoApi = monaco
  defineCustomThemes(monaco, codeColorScheme.value)

  if (!containerRef.value) return

  const editor = monaco.editor.create(containerRef.value, {
    value: props.modelValue,
    language: 'json',
    theme: themeName(theme.value),
    automaticLayout: false, // we drive layout via ResizeObserver instead
    minimap: { enabled: false },
    fontFamily: fontFamilyStack.value,
    fontSize: fontSize.value,
    lineHeight: Math.round(fontSize.value * 1.55),
    padding: { top: 12, bottom: 12 },
    readOnly: props.readOnly,
    scrollBeyondLastLine: false,
    renderLineHighlight: 'line',
    tabSize: 2,
    wordWrap: 'on',
  })

  editorRef.value = editor

  editor.onDidChangeModelContent(() => {
    if (applyingExternalValue) return
    emit('update:modelValue', editor.getValue())
  })

  resizeObserver = new ResizeObserver(() => editor.layout())
  resizeObserver.observe(containerRef.value)
})

watch(
  () => props.modelValue,
  (next) => {
    const editor = editorRef.value
    if (!editor) return
    if (editor.getValue() === next) return
    applyingExternalValue = true
    const position = editor.getPosition()
    editor.setValue(next)
    if (position) editor.setPosition(position)
    applyingExternalValue = false
  }
)

watch(
  () => props.readOnly,
  (readOnly) => {
    editorRef.value?.updateOptions({ readOnly })
  }
)

// Swap Monaco's own theme (it doesn't read Tailwind/CSS variables) whenever
// the app-wide light/dark toggle changes.
watch(theme, (next) => {
  monacoApi?.editor.setTheme(themeName(next))
})

// defineTheme only registers colors — re-applying via setTheme is what
// actually pushes the new rules onto tokens already rendered on screen.
watch(codeColorScheme, (next) => {
  if (!monacoApi) return
  defineCustomThemes(monacoApi, next)
  monacoApi.editor.setTheme(themeName(theme.value))
})

// Monaco caches glyph-width measurements from the options it was given, so
// font family/size changes must go through updateOptions to re-measure —
// just relying on inherited CSS wouldn't reflow the gutter/wrapping.
watch(fontFamilyStack, (next) => {
  editorRef.value?.updateOptions({ fontFamily: next })
})

watch(fontSize, (next) => {
  editorRef.value?.updateOptions({ fontSize: next, lineHeight: Math.round(next * 1.55) })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  editorRef.value?.dispose()
  monacoApi = null
})

defineExpose({
  focus: () => editorRef.value?.focus(),
})
</script>

<template>
  <div ref="containerRef" class="h-full w-full" role="textbox" aria-label="JSON editor" />
</template>
