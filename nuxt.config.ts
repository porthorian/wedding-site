// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Pinyon+Script&display=swap',
        },
      ],
    },
  },
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
  fonts: {
    families: [
      { name: 'Pinyon Script', provider: 'none' },
    ],
  },
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
