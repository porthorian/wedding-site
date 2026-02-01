// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    recaptchaSecret: process.env.RECAPTCHA_SECRET,
    recaptchaMinimumScore: process.env.RECAPTCHA_MINIMUM_SCORE ? Number(process.env.RECAPTCHA_MINIMUM_SCORE) : 0.5,
    recaptchaExpectedAction: process.env.RECAPTCHA_EXPECTED_ACTION,
    recaptchaBypass: process.env.RECAPTCHA_BYPASS === 'true',
    googleSheets: {
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      worksheetName: process.env.GOOGLE_SHEETS_WORKSHEET_NAME || 'RSVPs',
    },
    public: {
      recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || '',
      recaptchaBypass: process.env.RECAPTCHA_BYPASS === 'true',
    },
  },
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
