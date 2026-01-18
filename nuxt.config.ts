// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  css: [
    'vuetify/styles',
    '~/assets/styles/main.css',
  ],
  modules: [
    '@nuxt/ui',
    '@nuxt/image',
  ],
  build: {
    transpile: ['vuetify'],
  },
  vite: {
    ssr: {
      noExternal: ['vuetify'],
    },
  },
  hooks: {
    'vite:extendConfig': (config) => {
      // Ensure Vuetify auto-imports components in Vite/Nuxt.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const vuetify = require('vite-plugin-vuetify').default
      config.plugins = config.plugins || []
      config.plugins.push(vuetify({ autoImport: true }))
    },
  },
})
