<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import loader from '@monaco-editor/loader'
import type * as Monaco from 'monaco-editor'
import { useTheme } from '~/composables/useTheme'
import { useFontSettings } from '~/composables/useFontSettings'

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

function defineCustomThemes(monaco: typeof Monaco) {
  monaco.editor.defineTheme(DARK_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: '8FAEC9' },
      { token: 'string.value.json', foreground: '94BE8C' },
      { token: 'number.json', foreground: 'D9B36C' },
      { token: 'keyword.json', foreground: 'C98A7E' }, // true / false / null
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
      { token: 'string.key.json', foreground: '3F6E92' },
      { token: 'string.value.json', foreground: '4C7F46' },
      { token: 'number.json', foreground: '9C7423' },
      { token: 'keyword.json', foreground: 'A85246' },
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
  defineCustomThemes(monaco)

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
