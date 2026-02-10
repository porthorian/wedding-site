const siteTitle = 'Rosa & Vincent | Wedding'
const siteDescription =
  'Join Rosa & Vincent on August 7, 2026 at The TillingHouse in Eatontown, NJ. ' +
  'View the schedule, travel details, registry, and gallery.'
const siteUrl = (process.env.NUXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '')
const withSiteUrl = (path: string) => (siteUrl ? `${siteUrl}${path}` : path)
const canonicalUrl = withSiteUrl('/')
const ogImageUrl = withSiteUrl('/social/og-image.jpg')

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      title: siteTitle,
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { name: 'description', content: siteDescription },
        { name: 'theme-color', content: '#f7f7f7' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: siteTitle },
        { property: 'og:description', content: siteDescription },
        { property: 'og:site_name', content: 'Rosa & Vincent Wedding' },
        { property: 'og:url', content: canonicalUrl },
        { property: 'og:image', content: ogImageUrl },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Rosa & Vincent wedding website preview' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: siteTitle },
        { name: 'twitter:description', content: siteDescription },
        { name: 'twitter:image', content: ogImageUrl },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Pinyon+Script&display=swap',
        },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'canonical', href: canonicalUrl },
      ],
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: 'Rosa & Vincent Wedding',
            eventStatus: 'https://schema.org/EventScheduled',
            eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
            startDate: '2026-08-07T16:30:00-04:00',
            location: {
              '@type': 'Place',
              name: 'The TillingHouse, Eatontown, NJ',
              address: 'The TillingHouse, Eatontown, NJ',
            },
            image: [ogImageUrl],
            description: siteDescription,
            url: canonicalUrl,
          }),
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
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || '',
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
