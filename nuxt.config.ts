// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
  ],

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
    typeCheck: true,
    shim: false,
  },

  // Monaco relies on window/document — kept out of SSR render via <ClientOnly>
  ssr: true,

  app: {
    head: {
      title: 'JSON Formatter & Validator',
      meta: [
        { name: 'description', content: 'Format, validate, and inspect JSON in your browser — entirely client-side, nothing leaves your machine.' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  vite: {
    optimizeDeps: {
      include: ['monaco-editor/esm/vs/language/json/json.worker'],
    },
    worker: {
      format: 'es',
    },
  },

  nitro: {
    prerender: {
      routes: ['/'],
    },
  },
})
