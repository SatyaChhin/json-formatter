<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 28 })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="JSON Formatter logo"
  >
    <!-- Left brace -->
    <path
      d="M12 4c-2.2 0-3.4 1.3-3.4 3.5v3.6c0 1.5-.6 2.2-2.1 2.4v1c1.5.2 2.1.9 2.1 2.4v3.6c0 2.2 1.2 3.5 3.4 3.5"
      stroke="rgb(139 147 248)"
      stroke-width="2.1"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <!-- Right brace -->
    <path
      d="M20 4c2.2 0 3.4 1.3 3.4 3.5v3.6c0 1.5.6 2.2 2.1 2.4v1c-1.5.2-2.1.9-2.1 2.4v3.6c0 2.2-1.2 3.5-3.4 3.5"
      stroke="rgb(139 147 248)"
      stroke-width="2.1"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <!-- Three token dots: string / number / boolean colors -->
    <circle cx="12.4" cy="16" r="1.6" fill="rgb(111 207 151)" />
    <circle cx="16" cy="16" r="1.6" fill="rgb(242 177 68)" />
    <circle cx="19.6" cy="16" r="1.6" fill="rgb(240 113 120)" />
  </svg>
</template>
