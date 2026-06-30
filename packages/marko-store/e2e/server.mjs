import { createServer as createHttpServer } from 'node:http'
import { createRequire } from 'node:module'
import path from 'node:path'
import url from 'node:url'
import { createServer as createViteServer } from 'vite'

const require = createRequire(import.meta.url)
const marko = require('@marko/vite').default
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const PORT = 5189

const devServer = await createViteServer({
  root: __dirname,
  configFile: false,
  appType: 'custom',
  logLevel: 'warn',
  plugins: [marko()],
  optimizeDeps: { force: false },
  server: { ws: false, hmr: false, middlewareMode: true },
  build: { assetsInlineLimit: 0 },
})

devServer.middlewares.use((req, res, next) => {
  if (req.url === '/favicon.ico') { res.statusCode = 204; res.end(); return }
  next()
})
devServer.middlewares.use(async (req, res, next) => {
  try {
    const { handler } = await devServer.ssrLoadModule(path.join(__dirname, './src/index.ts'))
    await handler(req, res, next)
  } catch (err) {
    devServer.ssrFixStacktrace(err)
    next(err)
  }
})
createHttpServer(devServer.middlewares).listen(PORT, () => {
  console.log(`helper e2e server on http://localhost:${PORT}`)
})
