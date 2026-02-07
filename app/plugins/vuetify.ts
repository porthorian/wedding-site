import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    icons: {
      defaultSet: 'mdi',
      aliases,
      sets: {
        mdi,
      },
    },
    theme: {
      defaultTheme: 'garden',
      themes: {
        garden: {
          dark: false,
          colors: {
            background: '#ffffff',
            surface: '#000000',
            primary: '#724961',
            secondary: '#c982ac',
            accent: '#6f895b',
            info: '#dca4c4',
            success: '#6f895b',
            warning: '#949b4d',
            error: '#86034c',
            'on-background': '#000000',
            'on-surface': '#ffffff',
            'on-primary': '#ffffff',
            'on-secondary': '#2b1e29',
            'on-accent': '#ffffff',
            'on-error': '#ffffff',
          },
        },
      },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
