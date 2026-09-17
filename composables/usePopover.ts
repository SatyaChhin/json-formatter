// composables/usePopover.ts
import { computed, onMounted, onUnmounted, ref } from 'vue'

/**
 * The one popover open anywhere in the app. Shared at module level so that
 * opening any menu (header, toolbar, card…) closes whichever was open before.
 */
const activePopover = ref<symbol | null>(null)

/**
 * Open/close state for a dropdown menu. Bind `rootRef` to the element that
 * wraps both the trigger button and the popup: clicks outside it and the
 * Escape key close the menu.
 */
export function usePopover() {
  const id = Symbol('popover')
  const rootRef = ref<HTMLElement | null>(null)

  const isOpen = computed({
    get: () => activePopover.value === id,
    set: (open: boolean) => {
      if (open) activePopover.value = id
      else if (activePopover.value === id) activePopover.value = null
    },
  })

  function toggle() {
    isOpen.value = !isOpen.value
  }

  function close() {
    isOpen.value = false
  }

  function handleDocumentClick(event: MouseEvent) {
    if (!isOpen.value || !rootRef.value) return
    // composedPath() is captured at dispatch, so clicks on items that remove
    // themselves (e.g. deleting a history entry) still count as inside
    if (!event.composedPath().includes(rootRef.value)) close()
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && isOpen.value) close()
  }

  onMounted(() => {
    document.addEventListener('click', handleDocumentClick)
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('click', handleDocumentClick)
    document.removeEventListener('keydown', handleKeydown)
    close()
  })

  return { isOpen, rootRef, toggle, close }
}
