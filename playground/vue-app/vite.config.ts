import process from 'node:process'
import { URL, fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import UnoCSS from 'unocss/vite'
import VueRouter from 'unplugin-vue-router/vite'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __DEV__: process.env.NODE_ENV !== 'production',
  },
  plugins: [
    vue(),
    vueJsx(),
    UnoCSS(),
    VueRouter({
      extensions: ['.vue'],
      dts: 'src/typed-router.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@perigee-ui/floating-vue': fileURLToPath(new URL('../../packages/floating-vue/src', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
