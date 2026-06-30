import { createServer as createHttpServer } from 'node:http'
import { createRequire } from 'node:module'
import path from 'node:path'
import url from 'node:url'

import { createServer as createViteServer } from 'vite'

const require = createRequire(import.meta.url)
const marko = require('@marko/vite').default
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const PORT = 5202

// A small Vite dev server in middleware mode renders the .marko pages and injects the browser
// scripts so the page resumes. NOTE: this is a development demonstration, not a deployable
// production server. Real Marko production uses @marko/run.

// Create the HTTP server first so Vite can attach its HMR websocket to the same server/port
// (otherwise the browser's HMR client tries to open a socket that isn't there).
const httpServer = createHttpServer()

const devServer = await createViteServer({
  root: __dirname,
  configFile: false,
  appType: 'custom',
  logLevel: 'warn',
  plugins: [marko()],
  server: { middlewareMode: true, hmr: { server: httpServer } },
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

httpServer.on('request', devServer.middlewares)
httpServer.listen(PORT, () => {
  console.log('example server on http://localhost:' + PORT)
})
