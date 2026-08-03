<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import loader from '@monaco-editor/loader'
import type * as Monaco from 'monaco-editor'
import { useTheme } from '~/composables/useTheme'

const props = defineProps<{
  original: string
  modified: string
}>()

const emit = defineEmits<{
  'update:modified': [value: string]
}>()

const { theme } = useTheme()

const containerRef = ref<HTMLDivElement | null>(null)
const diffEditorRef = shallowRef<Monaco.editor.IStandaloneDiffEditor | null>(null)
let monacoApi: typeof Monaco | null = null
let resizeObserver: ResizeObserver | null = null
let applyingExternalValue = false

const DARK_THEME = 'json-formatter-ink'
const LIGHT_THEME = 'json-formatter-paper'

function themeName(t: 'light' | 'dark') {
  return t === 'light' ? LIGHT_THEME : DARK_THEME
}

// Mirrors JsonEditor.vue's custom themes. monaco.editor.defineTheme is
// idempotent (re-registering just overwrites with the same values), so it's
// safe to call again here even though JsonEditor also registers them.
function defineCustomThemes(monaco: typeof Monaco) {
  monaco.editor.defineTheme(DARK_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'string.key.json', foreground: '8FAEC9' },
      { token: 'string.value.json', foreground: '94BE8C' },
      { token: 'number.json', foreground: 'D9B36C' },
      { token: 'keyword.json', foreground: 'C98A7E' },
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

  const diffEditor = monaco.editor.createDiffEditor(containerRef.value, {
    automaticLayout: false,
    renderSideBySide: true,
    theme: themeName(theme.value),
    fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
    fontSize: 13,
    lineHeight: 20,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    originalEditable: false,
  })

  const originalModel = monaco.editor.createModel(props.original, 'json')
  const modifiedModel = monaco.editor.createModel(props.modified, 'json')
  diffEditor.setModel({ original: originalModel, modified: modifiedModel })
  diffEditorRef.value = diffEditor

  modifiedModel.onDidChangeContent(() => {
    if (applyingExternalValue) return
    emit('update:modified', modifiedModel.getValue())
  })

  resizeObserver = new ResizeObserver(() => diffEditor.layout())
  resizeObserver.observe(containerRef.value)
})

watch(
  () => props.original,
  (next) => {
    const model = diffEditorRef.value?.getModel()?.original
    if (!model || model.getValue() === next) return
    applyingExternalValue = true
    model.setValue(next)
    applyingExternalValue = false
  }
)

watch(
  () => props.modified,
  (next) => {
    const model = diffEditorRef.value?.getModel()?.modified
    if (!model || model.getValue() === next) return
    applyingExternalValue = true
    model.setValue(next)
    applyingExternalValue = false
  }
)

watch(theme, (next) => {
  monacoApi?.editor.setTheme(themeName(next))
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  const model = diffEditorRef.value?.getModel()
  model?.original?.dispose()
  model?.modified?.dispose()
  diffEditorRef.value?.dispose()
  monacoApi = null
})
</script>

<template>
  <div ref="containerRef" class="h-full w-full" role="group" aria-label="JSON diff" />
</template>
