import { defineConfig } from 'vite'
import marko from '@marko/vite'

// linked: false => browser-only build. The .marko is mounted on the client (src/index.ts),
// so there is no server pass. The SSR examples (ssr-resume etc.) use the default linked mode.
export default defineConfig({
  plugins: [marko({ linked: false })],
})
