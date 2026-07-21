<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import loader from '@monaco-editor/loader'
import type * as Monaco from 'monaco-editor'
import { useTheme } from '~/composables/useTheme'

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
      { token: 'string.key.json', foreground: '8B93F8' },
      { token: 'string.value.json', foreground: '6FCF97' },
      { token: 'number.json', foreground: 'F2B144' },
      { token: 'keyword.json', foreground: 'F07178' }, // true / false / null
      { token: 'delimiter.bracket.json', foreground: '8890A6' },
      { token: 'delimiter.array.json', foreground: '8890A6' },
      { token: 'delimiter.comma.json', foreground: '8890A6' },
    ],
    colors: {
      'editor.background': '#1B1F2C',
      'editor.foreground': '#E8E6DE',
      'editor.lineHighlightBackground': '#232838',
      'editorLineNumber.foreground': '#4A5064',
      'editorLineNumber.activeForeground': '#8890A6',
      'editorCursor.foreground': '#8B93F8',
      'editor.selectionBackground': '#8B93F833',
      'editorGutter.background': '#1B1F2C',
      'scrollbarSlider.background': '#2B304066',
      'scrollbarSlider.hoverBackground': '#2B304099',
    },
  })

  monaco.editor.defineTheme(LIGHT_THEME, {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: '4F54D1' },
      { token: 'string.value.json', foreground: '18804D' },
      { token: 'number.json', foreground: 'A86F08' },
      { token: 'keyword.json', foreground: 'C22F3A' },
      { token: 'delimiter.bracket.json', foreground: '646A7A' },
      { token: 'delimiter.array.json', foreground: '646A7A' },
      { token: 'delimiter.comma.json', foreground: '646A7A' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#181A22',
      'editor.lineHighlightBackground': '#F4F5F8',
      'editorLineNumber.foreground': '#B7BBC7',
      'editorLineNumber.activeForeground': '#646A7A',
      'editorCursor.foreground': '#4F54D1',
      'editor.selectionBackground': '#4F54D122',
      'editorGutter.background': '#FFFFFF',
      'scrollbarSlider.background': '#E0E2E866',
      'scrollbarSlider.hoverBackground': '#E0E2E899',
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
    fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
    fontSize: 13,
    lineHeight: 20,
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
