import {
  defineConfig,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'
import { createLocalFontProcessor } from '@unocss/preset-web-fonts/local'

export default defineConfig({
  shortcuts: [
    {
      reference: 'bg-slate-200/90 rounded p-2 px-3 transition-colors hover:bg-slate-200/50 data-[open]:bg-slate-200/50',
      floating: 'bg-black text-white p-1 px-2 rounded',
    },
  ],
  presets: [
    presetIcons(),
    presetUno(),
    presetTypography(),
    presetWebFonts({
      provider: 'google',
      fonts: {
        sans: 'Roboto',
        mono: ['Fira Code', 'Fira Mono:400,700'],
        lobster: 'Lobster',
        lato: [
          {
            name: 'Lato',
            weights: ['400', '700'],
            italic: true,
          },
          {
            name: 'sans-serif',
            provider: 'none',
          },
        ],
      },
      processors: createLocalFontProcessor(),
    }),

  ],
  transformers: [transformerDirectives(), transformerVariantGroup()],
})
