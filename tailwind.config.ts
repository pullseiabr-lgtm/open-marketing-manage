import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        or: 'var(--or)',
        or2: 'var(--or2)',
        or3: 'var(--or3)',
        bk: 'var(--bk)',
        bk2: 'var(--bk2)',
        bk3: 'var(--bk3)',
        bk4: 'var(--bk4)',
        bk5: 'var(--bk5)',
        gr: 'var(--gr)',
        gr2: 'var(--gr2)',
        gr3: 'var(--gr3)',
        lgt: 'var(--lgt)',
        ok: 'var(--ok)',
        wr: 'var(--wr)',
        er: 'var(--er)',
        bl: 'var(--bl)',
        cy: 'var(--cy)',
        pu: 'var(--pu)',
      },
      borderRadius: {
        DEFAULT: 'var(--r)',
        lg: 'var(--r2)',
      },
      boxShadow: {
        DEFAULT: 'var(--sh)',
      },
    },
  },
  plugins: [],
}

export default config
