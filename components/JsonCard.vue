<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch, type Component } from 'vue'
import { AlignLeft, Check, Copy, Download, FileJson, Loader2, Palette, Search, X } from 'lucide-vue-next'

const props = defineProps<{
  /** Source JSON text — the card body resets to this whenever it changes */
  json: string
}>()

const emit = defineEmits<{
  toast: [text: string, variant: 'success' | 'error' | 'info']
}>()

// Light header colors. Listed as full literal class names so Tailwind's JIT picks them up.
const headerColors = [
  'bg-slate-100', 'bg-gray-100', 'bg-zinc-100', 'bg-neutral-100', 'bg-stone-100',
  'bg-red-100', 'bg-orange-100', 'bg-amber-100', 'bg-yellow-100', 'bg-lime-100',
  'bg-green-100', 'bg-emerald-100', 'bg-teal-100', 'bg-cyan-100', 'bg-sky-100',
  'bg-blue-100', 'bg-indigo-100', 'bg-violet-100', 'bg-purple-100', 'bg-fuchsia-100',
  'bg-pink-100', 'bg-rose-100',
]

// Icon results are capped so the picker grid stays responsive
const ICON_LIMIT = 100

const title = ref('API Response Data')
const headerColor = ref('bg-blue-100')
const headerIcon = shallowRef<Component>(FileJson)
const text = ref(props.json)

watch(() => props.json, (next) => {
  text.value = next
})

const colorMenuOpen = ref(false)
const iconMenuOpen = ref(false)
const iconSearch = ref('')
const iconSearchRef = ref<HTMLInputElement | null>(null)
const colorMenuRef = ref<HTMLElement | null>(null)
const iconMenuRef = ref<HTMLElement | null>(null)
const captureRef = ref<HTMLElement | null>(null)

// The full lucide icon map is large, so it's only loaded the first time the picker opens
const allIcons = shallowRef<Record<string, Component> | null>(null)

const filteredIcons = computed<[string, Component][]>(() => {
  if (!allIcons.value) return []
  const term = iconSearch.value.trim().toLowerCase()
  const result: [string, Component][] = []
  for (const [name, icon] of Object.entries(allIcons.value)) {
    if (!term || name.toLowerCase().includes(term)) {
      result.push([name, icon])
      if (result.length >= ICON_LIMIT) break
    }
  }
  return result
})

async function toggleIconMenu() {
  iconMenuOpen.value = !iconMenuOpen.value
  colorMenuOpen.value = false
  if (!iconMenuOpen.value) return
  if (!allIcons.value) {
    const mod = await import('lucide-vue-next')
    allIcons.value = mod.icons as Record<string, Component>
  }
  iconSearchRef.value?.focus()
}

function toggleColorMenu() {
  colorMenuOpen.value = !colorMenuOpen.value
  iconMenuOpen.value = false
}

function selectIcon(icon: Component) {
  headerIcon.value = icon
  iconMenuOpen.value = false
}

function selectColor(color: string) {
  headerColor.value = color
  colorMenuOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node
  if (colorMenuOpen.value && colorMenuRef.value && !colorMenuRef.value.contains(target)) {
    colorMenuOpen.value = false
  }
  if (iconMenuOpen.value && iconMenuRef.value && !iconMenuRef.value.contains(target)) {
    iconMenuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

/** Transient per-button status label, e.g. "Copied!" for 2s */
type ActionState = 'idle' | 'busy' | 'done' | 'failed'
const formatState = ref<ActionState>('idle')
const copyState = ref<ActionState>('idle')
const downloadState = ref<ActionState>('idle')

function flash(state: typeof formatState, next: ActionState) {
  state.value = next
  setTimeout(() => {
    state.value = 'idle'
  }, 2000)
}

function handleFormat() {
  try {
    text.value = JSON.stringify(JSON.parse(text.value), null, 2)
    flash(formatState, 'done')
  } catch {
    flash(formatState, 'failed')
  }
}

/**
 * Renders the card to a canvas. The editor textarea and title input are
 * rendered as plain elements during capture — html2canvas clips form
 * controls and doesn't grow them to fit their content.
 */
const isCapturing = ref(false)

async function renderCanvas(): Promise<HTMLCanvasElement> {
  const el = captureRef.value
  if (!el) throw new Error('Card not mounted')
  const { default: html2canvas } = await import('html2canvas')
  isCapturing.value = true
  try {
    // Wait for the static capture markup to render
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    return await html2canvas(el, {
      backgroundColor: null,
      scale: 2,
      width: el.scrollWidth,
      height: el.scrollHeight,
    })
  } finally {
    isCapturing.value = false
  }
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Empty image'))), 'image/png')
  })
}

async function handleCopyImage() {
  if (copyState.value === 'busy') return
  copyState.value = 'busy'
  try {
    const canvas = await renderCanvas()
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': canvasToBlob(canvas) })])
    flash(copyState, 'done')
    emit('toast', 'Card image copied to clipboard', 'success')
  } catch (err) {
    console.error('Copy card image failed:', err)
    flash(copyState, 'failed')
    emit('toast', 'Could not copy image — your browser may not support it', 'error')
  }
}

async function handleDownloadImage() {
  if (downloadState.value === 'busy') return
  downloadState.value = 'busy'
  try {
    const canvas = await renderCanvas()
    const url = URL.createObjectURL(await canvasToBlob(canvas))
    const link = document.createElement('a')
    link.href = url
    link.download = `${slugify(title.value) || 'json-card'}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    flash(downloadState, 'done')
  } catch (err) {
    console.error('Download card image failed:', err)
    flash(downloadState, 'failed')
    emit('toast', 'Could not render card image', 'error')
  }
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

const actionButtonClass =
  'flex items-center gap-1 rounded border border-surface-hair px-2 py-1 text-xs text-parchment transition hover:border-key/50 hover:text-key disabled:cursor-wait disabled:opacity-60'
</script>

<template>
  <div class="flex h-full flex-col gap-3 p-1">
    <!-- Controls -->
    <div class="flex flex-wrap items-center gap-2">
      <div ref="colorMenuRef" class="relative">
        <button type="button" :class="actionButtonClass" :aria-expanded="colorMenuOpen" @click="toggleColorMenu">
          <Palette class="h-3.5 w-3.5" aria-hidden="true" />
          Header color
        </button>
        <div v-if="colorMenuOpen"
          class="absolute left-0 top-full z-20 mt-1 w-60 rounded border border-surface-hair bg-surface-raised p-3 shadow-panel">
          <p class="mb-2 text-[10.5px] uppercase tracking-wide text-muted">Select color</p>
          <div class="grid grid-cols-6 gap-2">
            <button v-for="color in headerColors" :key="color" type="button"
              class="h-7 w-7 rounded-full border transition hover:scale-110"
              :class="[color, headerColor === color ? 'border-key ring-2 ring-key/50' : 'border-slate-300']"
              :title="color.replace('bg-', '').replace('-100', '')" @click="selectColor(color)" />
          </div>
        </div>
      </div>

      <button type="button" :class="actionButtonClass" @click="handleFormat">
        <Check v-if="formatState === 'done'" class="h-3.5 w-3.5 text-string" aria-hidden="true" />
        <X v-else-if="formatState === 'failed'" class="h-3.5 w-3.5 text-boolean" aria-hidden="true" />
        <AlignLeft v-else class="h-3.5 w-3.5" aria-hidden="true" />
        {{ formatState === 'done' ? 'Formatted' : formatState === 'failed' ? 'Invalid JSON' : 'Format JSON' }}
      </button>

      <button type="button" :class="actionButtonClass" :disabled="copyState === 'busy'" @click="handleCopyImage">
        <Loader2 v-if="copyState === 'busy'" class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        <Check v-else-if="copyState === 'done'" class="h-3.5 w-3.5 text-string" aria-hidden="true" />
        <X v-else-if="copyState === 'failed'" class="h-3.5 w-3.5 text-boolean" aria-hidden="true" />
        <Copy v-else class="h-3.5 w-3.5" aria-hidden="true" />
        {{ copyState === 'busy' ? 'Copying...' : copyState === 'done' ? 'Copied!' : copyState === 'failed' ? 'Failed' : 'Copy image' }}
      </button>

      <button type="button"
        class="flex items-center gap-1 rounded border border-key/50 bg-key/20 px-2 py-1 text-xs text-key transition hover:bg-key/30 disabled:cursor-wait disabled:opacity-60"
        :disabled="downloadState === 'busy'" @click="handleDownloadImage">
        <Loader2 v-if="downloadState === 'busy'" class="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        <Check v-else-if="downloadState === 'done'" class="h-3.5 w-3.5" aria-hidden="true" />
        <X v-else-if="downloadState === 'failed'" class="h-3.5 w-3.5" aria-hidden="true" />
        <Download v-else class="h-3.5 w-3.5" aria-hidden="true" />
        {{ downloadState === 'busy' ? 'Processing...' : downloadState === 'done' ? 'Downloaded!' : downloadState === 'failed' ? 'Failed' : 'Download PNG' }}
      </button>
    </div>

    <!-- Card (always light so exported images look the same in either theme) -->
    <div class="min-h-0 flex-1 overflow-auto pb-8">
      <div ref="captureRef"
        class="inline-flex min-w-[400px] flex-col overflow-hidden rounded-2xl bg-slate-50 font-sans text-slate-800">
        <div class="flex items-center gap-3 border-b border-black/5 px-5 py-4 transition-colors duration-300"
          :class="headerColor">
          <div ref="iconMenuRef" class="relative">
            <button type="button" class="rounded-lg bg-white/50 p-2 transition-colors hover:bg-white"
              title="Change icon" :aria-expanded="iconMenuOpen" @click="toggleIconMenu">
              <component :is="headerIcon" class="h-6 w-6 text-slate-700" aria-hidden="true" />
            </button>
            <div v-if="iconMenuOpen && !isCapturing"
              class="absolute left-0 top-full z-20 mt-2 flex max-h-96 w-72 flex-col rounded-xl border border-slate-200 bg-white shadow-xl"
              data-html2canvas-ignore>
              <div class="border-b border-slate-100 p-3">
                <div class="relative">
                  <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true" />
                  <input ref="iconSearchRef" v-model="iconSearch" type="text" placeholder="Search icons..."
                    class="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div class="grid flex-1 grid-cols-6 gap-2 overflow-y-auto p-3">
                <p v-if="!allIcons" class="col-span-6 py-4 text-center text-xs text-slate-400">Loading icons...</p>
                <p v-else-if="!filteredIcons.length" class="col-span-6 py-4 text-center text-xs text-slate-400">
                  No icons found
                </p>
                <button v-for="[name, icon] in filteredIcons" :key="name" type="button"
                  class="flex items-center justify-center rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-blue-600"
                  :title="name" @click="selectIcon(icon)">
                  <component :is="icon" class="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          <span v-if="isCapturing" class="min-w-[300px] whitespace-pre text-xl font-bold text-slate-800">{{ title }}</span>
          <input v-else v-model="title" type="text" placeholder="Enter title..."
            class="w-full min-w-[300px] border-none bg-transparent text-xl font-bold text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-0" />
        </div>

        <!-- Body: an invisible sizer shares the grid cell with the textarea so the card grows to fit the text -->
        <div class="grid p-5">
          <pre aria-hidden="true"
            class="invisible col-start-1 row-start-1 m-0 min-w-[300px] whitespace-pre p-0 font-mono text-sm leading-relaxed">{{ text + ' ' }}</pre>
          <pre v-if="isCapturing"
            class="col-start-1 row-start-1 m-0 whitespace-pre p-0 font-mono text-sm leading-relaxed text-slate-700">{{ text }}</pre>
          <textarea v-else v-model="text" wrap="off" spellcheck="false"
            class="col-start-1 row-start-1 m-0 block h-full w-full resize-none overflow-hidden whitespace-pre border-none bg-transparent p-0 font-mono text-sm leading-relaxed text-slate-700 focus:outline-none focus:ring-0" />
        </div>
      </div>
    </div>
  </div>
</template>
