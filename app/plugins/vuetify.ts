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
            background: '#fdf8f3',
            surface: '#fff7ef',
            primary: '#d36b7c',
            secondary: '#f2b880',
            accent: '#6b8f71',
            info: '#78a6b3',
            success: '#7cb28e',
            warning: '#e7b36c',
            error: '#cc5c5c',
          },
        },
      },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
