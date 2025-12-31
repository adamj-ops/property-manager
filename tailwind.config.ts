import defaultTheme from 'tailwindcss/defaultTheme'
import type { Config } from 'tailwindcss'

import shadcnPreset from './plugins/tailwind/shadcn-preset'

export default {
  presets: [
    // Use 'property-management' for the warm gray theme with soft green/coral accents
    // Alternative themes: 'zinc', 'slate', 'stone', 'gray', 'neutral', 'blue', 'green', etc.
    shadcnPreset({ color: 'property-management', radius: '0.375' }),
  ],
  content: [
    './src/components/**/*.tsx',
    './src/routes/**/*.tsx',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Variable', 'Noto Sans TC Variable', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono Variable', ...defaultTheme.fontFamily.mono],
      },
      // Custom shadows for refined depth (matching Rehab Planner Pro)
      boxShadow: {
        '2xs': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
    },
  },
} satisfies Config
