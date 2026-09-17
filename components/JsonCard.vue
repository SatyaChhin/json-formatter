<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch, type Component } from 'vue'
import { Check, Copy, Download, FileJson, LayoutTemplate, Loader2, Palette, Search, X } from 'lucide-vue-next'

const props = defineProps<{
  /** Source JSON text — the card body resets to this whenever it changes */
  json: string
}>()

const emit = defineEmits<{
  toast: [text: string, variant: 'success' | 'error' | 'info']
}>()

// Colors are plain hex values applied as inline styles, so any custom color works
// and html2canvas renders exactly what's on screen.
const backgroundPresets = [
  // Tailwind 100 shades
  '#f1f5f9', '#f3f4f6', '#f4f4f5', '#f5f5f5', '#f5f5f4', '#fee2e2', '#ffedd5', '#fef3c7',
  '#fef9c3', '#ecfccb', '#dcfce7', '#d1fae5', '#ccfbf1', '#cffafe', '#e0f2fe', '#dbeafe',
  '#e0e7ff', '#ede9fe', '#f3e8ff', '#fae8ff', '#fce7f3', '#ffe4e6',
  // Strong / dark
  '#ffffff', '#f8fafc', '#2563eb', '#4f46e5', '#7c3aed', '#059669', '#e11d48', '#f59e0b',
  '#334155', '#1e293b', '#0f172a', '#000000',
]

const textPresets = [
  '#0f172a', '#1e293b', '#334155', '#64748b', '#94a3b8', '#ffffff', '#000000', '#1d4ed8',
  '#4338ca', '#6d28d9', '#7e22ce', '#be185d', '#b91c1c', '#c2410c', '#b45309', '#4d7c0f',
  '#047857', '#0f766e', '#0e7490', '#0369a1',
]

type ColorTarget = 'headerBg' | 'headerText' | 'bodyBg' | 'bodyText'

interface CardTemplate {
  id: string
  label: string
  /** icon: icon picker + large title · window: macOS traffic lights + centered title · minimal: small caps title, no divider */
  header: 'icon' | 'window' | 'minimal'
  colors: Record<ColorTarget, string>
  radius: number
  /** Card border color, or null for none */
  border: string | null
  shadow: boolean
  /** CSS background painted around the card, or null for no backdrop */
  backdrop: string | null
}

const DEFAULT_BACKDROP = 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)'

const cardTemplates: CardTemplate[] = [
  {
    id: 'classic', label: 'Classic', header: 'icon', radius: 16, border: null, shadow: false, backdrop: null,
    colors: { headerBg: '#dbeafe', headerText: '#1e293b', bodyBg: '#f8fafc', bodyText: '#334155' },
  },
  {
    id: 'mac-dark', label: 'macOS Dark', header: 'window', radius: 12, border: '#3f3f46', shadow: true,
    backdrop: DEFAULT_BACKDROP,
    colors: { headerBg: '#2d2d30', headerText: '#d4d4d8', bodyBg: '#1e1e1e', bodyText: '#d4d4d4' },
  },
  {
    id: 'mac-light', label: 'macOS Light', header: 'window', radius: 12, border: '#e5e7eb', shadow: true,
    backdrop: 'linear-gradient(135deg, #93c5fd 0%, #c4b5fd 100%)',
    colors: { headerBg: '#f3f4f6', headerText: '#374151', bodyBg: '#ffffff', bodyText: '#1f2937' },
  },
  {
    id: 'terminal', label: 'Terminal', header: 'window', radius: 8, border: '#14532d', shadow: false, backdrop: null,
    colors: { headerBg: '#0b120d', headerText: '#22c55e', bodyBg: '#050805', bodyText: '#4ade80' },
  },
  {
    id: 'minimal', label: 'Minimal', header: 'minimal', radius: 8, border: '#e5e7eb', shadow: false, backdrop: null,
    colors: { headerBg: '#ffffff', headerText: '#64748b', bodyBg: '#ffffff', bodyText: '#0f172a' },
  },
  {
    id: 'midnight', label: 'Midnight', header: 'icon', radius: 16, border: '#334155', shadow: false, backdrop: null,
    colors: { headerBg: '#1e293b', headerText: '#e2e8f0', bodyBg: '#0f172a', bodyText: '#cbd5e1' },
  },
  {
    id: 'sunset', label: 'Sunset', header: 'icon', radius: 20, border: null, shadow: true,
    backdrop: 'linear-gradient(135deg, #f97316 0%, #db2777 100%)',
    colors: { headerBg: '#fb923c', headerText: '#ffffff', bodyBg: '#fff7ed', bodyText: '#7c2d12' },
  },
  {
    id: 'ocean', label: 'Ocean', header: 'icon', radius: 20, border: null, shadow: true,
    backdrop: 'linear-gradient(135deg, #0ea5e9 0%, #1e3a8a 100%)',
    colors: { headerBg: '#0369a1', headerText: '#ffffff', bodyBg: '#f0f9ff', bodyText: '#0c4a6e' },
  },
]

const templateId = ref(cardTemplates[0]!.id)
const template = computed(() => cardTemplates.find((tpl) => tpl.id === templateId.value) ?? cardTemplates[0]!)
const showBackdrop = ref(false)

function applyTemplate(tpl: CardTemplate) {
  templateId.value = tpl.id
  colors.value = { ...tpl.colors }
  hexDraft.value = colors.value[activeColorTarget.value]
  showBackdrop.value = tpl.backdrop !== null
  if (tpl.header !== 'icon') iconMenuOpen.value = false
}

const cardStyle = computed(() => ({
  backgroundColor: colors.value.bodyBg,
  borderRadius: `${template.value.radius}px`,
  border: template.value.border ? `1px solid ${template.value.border}` : undefined,
  boxShadow: template.value.shadow ? '0 20px 50px -12px rgba(0, 0, 0, 0.45)' : undefined,
}))

const TRAFFIC_LIGHTS = ['#ff5f57', '#febc2e', '#28c840']

const colorTargets: { id: ColorTarget; label: string; presets: string[] }[] = [
  { id: 'headerBg', label: 'Header', presets: backgroundPresets },
  { id: 'headerText', label: 'Header text', presets: textPresets },
  { id: 'bodyBg', label: 'Body', presets: backgroundPresets },
  { id: 'bodyText', label: 'Body text', presets: textPresets },
]

// Icon results are capped so the picker grid stays responsive
const ICON_LIMIT = 100

const title = ref('API Response Data')
const colors = ref<Record<ColorTarget, string>>({ ...cardTemplates[0]!.colors })
const activeColorTarget = ref<ColorTarget>('headerBg')
const activeTarget = computed(() => colorTargets.find((target) => target.id === activeColorTarget.value)!)
const hexDraft = ref(colors.value.headerBg)
const headerIcon = shallowRef<Component>(FileJson)
const text = ref(props.json)

watch(() => props.json, (next) => {
  text.value = next
})

const colorMenuOpen = ref(false)
const templateMenuOpen = ref(false)
const iconMenuOpen = ref(false)
const iconSearch = ref('')
const iconSearchRef = ref<HTMLInputElement | null>(null)
const colorMenuRef = ref<HTMLElement | null>(null)
const templateMenuRef = ref<HTMLElement | null>(null)
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
  templateMenuOpen.value = false
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
  templateMenuOpen.value = false
}

function toggleTemplateMenu() {
  templateMenuOpen.value = !templateMenuOpen.value
  colorMenuOpen.value = false
  iconMenuOpen.value = false
}

function selectIcon(icon: Component) {
  headerIcon.value = icon
  iconMenuOpen.value = false
}

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

/** Expands shorthand (#abc) so the value also works in <input type="color"> */
function normalizeHex(value: string): string | null {
  const digits = value.trim().match(HEX_PATTERN)?.[1]
  if (!digits) return null
  const hex = digits.length === 3 ? [...digits].map((c) => c + c).join('') : digits
  return `#${hex.toLowerCase()}`
}

function setColor(color: string) {
  const hex = normalizeHex(color)
  if (!hex) return
  colors.value[activeColorTarget.value] = hex
  hexDraft.value = hex
}

function commitHexDraft() {
  if (normalizeHex(hexDraft.value)) setColor(hexDraft.value)
  else hexDraft.value = colors.value[activeColorTarget.value]
}

/** Restores the active template's colors */
function resetColors() {
  colors.value = { ...template.value.colors }
  hexDraft.value = colors.value[activeColorTarget.value]
}

watch(activeColorTarget, (target) => {
  hexDraft.value = colors.value[target]
})

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node
  if (colorMenuOpen.value && colorMenuRef.value && !colorMenuRef.value.contains(target)) {
    colorMenuOpen.value = false
  }
  if (templateMenuOpen.value && templateMenuRef.value && !templateMenuRef.value.contains(target)) {
    templateMenuOpen.value = false
  }
  if (iconMenuOpen.value && iconMenuRef.value && !iconMenuRef.value.contains(target)) {
    iconMenuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

/** Transient per-button status label, e.g. "Copied!" for 2s */
type ActionState = 'idle' | 'busy' | 'done' | 'failed'
const copyState = ref<ActionState>('idle')
const downloadState = ref<ActionState>('idle')

function flash(state: typeof copyState, next: ActionState) {
  state.value = next
  setTimeout(() => {
    state.value = 'idle'
  }, 2000)
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
      <div ref="templateMenuRef" class="relative">
        <button type="button" :class="actionButtonClass" :aria-expanded="templateMenuOpen" @click="toggleTemplateMenu">
          <LayoutTemplate class="h-3.5 w-3.5" aria-hidden="true" />
          Template: {{ template.label }}
        </button>
        <div v-if="templateMenuOpen"
          class="absolute left-0 top-full z-20 mt-1 w-80 rounded border border-surface-hair bg-surface-raised p-3 shadow-panel">
          <p class="mb-2 text-[10.5px] uppercase tracking-wide text-muted">Templates</p>
          <div class="grid grid-cols-2 gap-2">
            <button v-for="tpl in cardTemplates" :key="tpl.id" type="button"
              class="flex flex-col gap-1.5 rounded border p-1.5 text-left transition"
              :class="templateId === tpl.id ? 'border-key bg-key/10' : 'border-surface-hair hover:border-key/50'"
              :aria-pressed="templateId === tpl.id" @click="applyTemplate(tpl)">
              <!-- Mini preview -->
              <span class="flex h-16 items-center justify-center rounded-sm p-2"
                :style="{ background: tpl.backdrop ?? 'transparent' }" aria-hidden="true">
                <span class="flex h-full w-full flex-col overflow-hidden"
                  :style="{
                    backgroundColor: tpl.colors.bodyBg,
                    borderRadius: `${Math.round(tpl.radius / 3)}px`,
                    border: tpl.border ? `1px solid ${tpl.border}` : undefined,
                  }">
                  <span class="flex h-3.5 shrink-0 items-center gap-0.5 px-1" :style="{ backgroundColor: tpl.colors.headerBg }">
                    <template v-if="tpl.header === 'window'">
                      <span v-for="dot in TRAFFIC_LIGHTS" :key="dot" class="h-1 w-1 rounded-full" :style="{ backgroundColor: dot }" />
                      <span class="mx-auto h-0.5 w-6 rounded-full" :style="{ backgroundColor: tpl.colors.headerText }" />
                    </template>
                    <template v-else>
                      <span v-if="tpl.header === 'icon'" class="h-1.5 w-1.5 rounded-sm" :style="{ backgroundColor: tpl.colors.headerText }" />
                      <span class="h-0.5 w-8 rounded-full" :style="{ backgroundColor: tpl.colors.headerText }" />
                    </template>
                  </span>
                  <span class="flex flex-1 flex-col gap-1 p-1.5">
                    <span class="h-0.5 w-3/4 rounded-full opacity-80" :style="{ backgroundColor: tpl.colors.bodyText }" />
                    <span class="ml-2 h-0.5 w-1/2 rounded-full opacity-80" :style="{ backgroundColor: tpl.colors.bodyText }" />
                    <span class="ml-2 h-0.5 w-2/3 rounded-full opacity-80" :style="{ backgroundColor: tpl.colors.bodyText }" />
                  </span>
                </span>
              </span>
              <span class="flex items-center gap-1 text-[11px]"
                :class="templateId === tpl.id ? 'text-key' : 'text-parchment'">
                {{ tpl.label }}
                <Check v-if="templateId === tpl.id" class="ml-auto h-3 w-3" aria-hidden="true" />
              </span>
            </button>
          </div>
          <label class="mt-3 flex cursor-pointer items-center gap-2 text-xs text-parchment">
            <input v-model="showBackdrop" type="checkbox" class="accent-[rgb(var(--c-key))]" />
            Gradient backdrop behind card
          </label>
        </div>
      </div>

      <div ref="colorMenuRef" class="relative">
        <button type="button" :class="actionButtonClass" :aria-expanded="colorMenuOpen" @click="toggleColorMenu">
          <Palette class="h-3.5 w-3.5" aria-hidden="true" />
          Colors
          <span class="flex items-center" aria-hidden="true">
            <span v-for="target in colorTargets" :key="target.id"
              class="-ml-1 h-3 w-3 rounded-full border border-surface-hair first:ml-1"
              :style="{ backgroundColor: colors[target.id] }" />
          </span>
        </button>
        <div v-if="colorMenuOpen"
          class="absolute left-0 top-full z-20 mt-1 w-72 rounded border border-surface-hair bg-surface-raised shadow-panel">
          <!-- Which part of the card to color -->
          <div class="grid grid-cols-4 gap-0.5 border-b border-surface-hair p-1">
            <button v-for="target in colorTargets" :key="target.id" type="button"
              class="flex flex-col items-center gap-1 rounded px-1 py-1.5 text-[10.5px] transition"
              :class="activeColorTarget === target.id ? 'bg-key/20 text-key' : 'text-muted hover:text-parchment'"
              :aria-pressed="activeColorTarget === target.id" @click="activeColorTarget = target.id">
              <span class="h-4 w-4 rounded-full border border-surface-hair"
                :style="{ backgroundColor: colors[target.id] }" aria-hidden="true" />
              {{ target.label }}
            </button>
          </div>

          <div class="p-3">
            <p class="mb-2 text-[10.5px] uppercase tracking-wide text-muted">Presets</p>
            <div class="grid grid-cols-8 gap-1.5">
              <button v-for="color in activeTarget.presets" :key="color" type="button"
                class="h-6 w-6 rounded-full border transition hover:scale-110"
                :class="colors[activeColorTarget] === color ? 'border-key ring-2 ring-key/50' : 'border-surface-hair'"
                :style="{ backgroundColor: color }" :title="color" :aria-label="color" @click="setColor(color)" />
            </div>

            <p class="mb-2 mt-3 text-[10.5px] uppercase tracking-wide text-muted">Custom</p>
            <div class="flex items-center gap-2">
              <input type="color" :value="colors[activeColorTarget]"
                class="h-8 w-10 cursor-pointer rounded border border-surface-hair bg-transparent p-0.5"
                aria-label="Pick custom color" @input="setColor(($event.target as HTMLInputElement).value)" />
              <input v-model="hexDraft" type="text" maxlength="7" spellcheck="false"
                class="w-24 rounded border border-surface-hair bg-surface px-2 py-1 font-mono text-xs uppercase text-parchment focus:border-key/50 focus:outline-none"
                aria-label="Hex color" @keydown.enter="commitHexDraft" @blur="commitHexDraft" />
              <button type="button" class="ml-auto text-[11px] text-muted transition hover:text-key"
                @click="resetColors">
                Reset to template
              </button>
            </div>
          </div>
        </div>
      </div>

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

    <!-- Card (styled by its template, independent of the app theme, so exports look the same either way) -->
    <div class="min-h-0 flex-1 overflow-auto pb-8">
      <!-- The backdrop wrapper is what gets exported, so the gradient padding is part of the image -->
      <div ref="captureRef" class="inline-block" :class="{ 'p-10': showBackdrop }"
        :style="{ background: showBackdrop ? (template.backdrop ?? DEFAULT_BACKDROP) : undefined }">
      <div class="flex min-w-[400px] flex-col overflow-hidden font-sans transition-colors duration-300" :style="cardStyle">
        <!-- Window header: traffic lights + centered title -->
        <div v-if="template.header === 'window'"
          class="grid grid-cols-[3.5rem_1fr_3.5rem] items-center border-b border-black/20 px-4 py-2.5 transition-colors duration-300"
          :style="{ backgroundColor: colors.headerBg, color: colors.headerText }">
          <span class="flex items-center gap-2" aria-hidden="true">
            <span v-for="dot in TRAFFIC_LIGHTS" :key="dot" class="h-3 w-3 rounded-full" :style="{ backgroundColor: dot }" />
          </span>
          <span v-if="isCapturing" class="min-w-[240px] whitespace-pre text-center text-sm font-medium">{{ title }}</span>
          <input v-else v-model="title" type="text" placeholder="Enter title..."
            class="w-full min-w-[240px] border-none bg-transparent text-center text-sm font-medium text-inherit placeholder:text-current placeholder:opacity-50 focus:outline-none focus:ring-0" />
        </div>

        <!-- Minimal header: small caps title, no divider -->
        <div v-else-if="template.header === 'minimal'" class="px-5 pt-4 transition-colors duration-300"
          :style="{ backgroundColor: colors.headerBg, color: colors.headerText }">
          <span v-if="isCapturing" class="block min-w-[300px] whitespace-pre text-xs font-semibold uppercase tracking-widest">{{ title }}</span>
          <input v-else v-model="title" type="text" placeholder="Enter title..."
            class="w-full min-w-[300px] border-none bg-transparent text-xs font-semibold uppercase tracking-widest text-inherit placeholder:text-current placeholder:opacity-50 focus:outline-none focus:ring-0" />
        </div>

        <!-- Icon header -->
        <div v-else class="flex items-center gap-3 border-b border-black/5 px-5 py-4 transition-colors duration-300"
          :style="{ backgroundColor: colors.headerBg, color: colors.headerText }">
          <div ref="iconMenuRef" class="relative">
            <button type="button" class="rounded-lg bg-white/50 p-2 transition-colors hover:bg-white"
              title="Change icon" :aria-expanded="iconMenuOpen" @click="toggleIconMenu">
              <component :is="headerIcon" class="h-6 w-6" aria-hidden="true" />
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

          <span v-if="isCapturing" class="min-w-[300px] whitespace-pre text-xl font-bold">{{ title }}</span>
          <input v-else v-model="title" type="text" placeholder="Enter title..."
            class="w-full min-w-[300px] border-none bg-transparent text-xl font-bold text-inherit placeholder:text-current placeholder:opacity-50 focus:outline-none focus:ring-0" />
        </div>

        <!-- Body: an invisible sizer shares the grid cell with the textarea so the card grows to fit the text -->
        <div class="grid p-5" :style="{ color: colors.bodyText }">
          <pre aria-hidden="true"
            class="invisible col-start-1 row-start-1 m-0 min-w-[300px] whitespace-pre p-0 font-mono text-sm leading-relaxed">{{ text + ' ' }}</pre>
          <pre v-if="isCapturing"
            class="col-start-1 row-start-1 m-0 whitespace-pre p-0 font-mono text-sm leading-relaxed">{{ text }}</pre>
          <textarea v-else v-model="text" wrap="off" spellcheck="false"
            class="col-start-1 row-start-1 m-0 block h-full w-full resize-none overflow-hidden whitespace-pre border-none bg-transparent p-0 font-mono text-sm leading-relaxed text-inherit focus:outline-none focus:ring-0" />
        </div>
      </div>
      </div>
    </div>
  </div>
</template>
