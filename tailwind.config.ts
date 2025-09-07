import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  darkMode: 'class',
  theme: {
    container: { center: true, padding: '2rem', screens: { xl: '1140px', '2xl': '1280px' } },
    extend: {
      fontFamily: {
        serifDisplay: ['"Playfair Display"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        bg: 'var(--bg)',
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        brand: 'var(--brand)',
        accent: 'var(--accent)',
        success: '#16A34A',
        warning: '#F59E0B',
        error: '#DC2626',
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0,0,0,0.06)',
        ring: '0 0 0 6px rgba(139,92,246,0.12)',
      },
      borderRadius: { xl: '1rem', '2xl': '1.5rem' },
      transitionTimingFunction: { 'soft': 'cubic-bezier(.2,.8,.2,1)' },
    },
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/forms'), require('@tailwindcss/aspect-ratio')],
}
