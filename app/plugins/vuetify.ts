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
            surface: '#ffffff',
            primary: '#111111',
            secondary: '#3d3d3d',
            accent: '#000000',
            info: '#5a5a5a',
            success: '#222222',
            warning: '#666666',
            error: '#000000',
            'on-background': '#111111',
            'on-surface': '#111111',
            'on-primary': '#ffffff',
            'on-secondary': '#ffffff',
            'on-accent': '#ffffff',
            'on-error': '#ffffff',
          },
        },
      },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
