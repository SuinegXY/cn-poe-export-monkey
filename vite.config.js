import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    cssInjectedByJsPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      external: [
        'vue',
        'cn-poe-translator/dist/index.global',
        'cn-poe-export-db/dist/db.global',
        'pob-building-creater/dist/creater.global',
        'axios',
      ],
    },
    minify: false,
  }
})
