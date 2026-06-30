import { defineConfig } from 'vite'
import marko from '@marko/vite'

// linked: false => browser-only build (a client-only SPA, mounted in src/index.ts).
export default defineConfig({
  plugins: [marko({ linked: false })],
})
