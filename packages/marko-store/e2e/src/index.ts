// TS server entry. Importing the .marko pages here (rather than ssrLoadModule-ing them
// directly) is what makes @marko/vite treat them as entries and inject the browser <script>
// tags so the pages resume on the client.
import liveness from './streaming-helper-liveness.marko'
import multi from './streaming-helper-multi.marko'
import ooo from './streaming-helper-ooo.marko'
import outside from './streaming-helper-outside.marko'
import effectOrder from './streaming-helper-effect-order.marko'
import contextAbove from './streaming-helper-context-above.marko'
import dupTry from './streaming-helper-dup-try.marko'
import providerCollision from './streaming-helper-provider-collision.marko'
import page from './page.marko'
import contextPage from './context-page.marko'
import contextPagePerreq from './context-page-perreq.marko'
import contextPageMulti from './context-page-multi.marko'
import streamingLiveness from './streaming-liveness.marko'
import streamingFillRender from './streaming-fill-render.marko'
import streamingFillOnmount from './streaming-fill-onmount.marko'
import streamingOutOfOrder from './streaming-out-of-order.marko'
import type { IncomingMessage, ServerResponse } from 'node:http'

type ServerTemplate = {
  render: (input: Record<string, unknown>) => AsyncIterable<string>
}

const routes: Record<string, { page: ServerTemplate; input: Record<string, unknown> }> = {
  // Phase 2a: from-mode selector + atom liveness.
  '/': { page: page as unknown as ServerTemplate, input: { $global: {} } },
  // Phase 2b: context delivery chain (provider + context-selector + store-context).
  '/context': { page: contextPage as unknown as ServerTemplate, input: { $global: {} } },
  // Phase 2b: per-request data rebuild (provider createStore(input.initial)).
  '/context-perreq': {
    page: contextPagePerreq as unknown as ServerTemplate,
    input: { $global: {}, initial: { count: 42 } },
  },
  // Phase 2b: multiple stores in one provider.
  '/context-multi': {
    page: contextPageMulti as unknown as ServerTemplate,
    input: { $global: {} },
  },
  // Phase 3: store liveness across in-order <await> streaming (incl. a late subtree).
  '/streaming-liveness': {
    page: streamingLiveness as unknown as ServerTemplate,
    input: { $global: {} },
  },
  // Phase 3 characterization: naive progressive-fill mechanisms (server-only vs client-only).
  '/streaming-fill-render': {
    page: streamingFillRender as unknown as ServerTemplate,
    input: { $global: {} },
  },
  '/streaming-fill-onmount': {
    page: streamingFillOnmount as unknown as ServerTemplate,
    input: { $global: {} },
  },
  // Phase 3: store liveness across an out-of-order (try/placeholder) reordered subtree.
  '/streaming-out-of-order': {
    page: streamingOutOfOrder as unknown as ServerTemplate,
    input: { $global: {} },
  },
  '/liveness': { page: liveness as unknown as ServerTemplate, input: { $global: {}, serverValue: 77 } },
  '/multi': { page: multi as unknown as ServerTemplate, input: { $global: {}, a: 11, b: 22 } },
  '/ooo': { page: ooo as unknown as ServerTemplate, input: { $global: {}, slow: 33, fast: 44 } },
  '/outside': { page: outside as unknown as ServerTemplate, input: { $global: {}, v: 55 } },
  '/effect-order': { page: effectOrder as unknown as ServerTemplate, input: { $global: {}, v: 66 } },
  '/context-above': { page: contextAbove as unknown as ServerTemplate, input: { $global: {}, v: 88 } },
  '/dup-try': { page: dupTry as unknown as ServerTemplate, input: { $global: {}, a: 111, b: 222 } },
  '/provider-collision': { page: providerCollision as unknown as ServerTemplate, input: { $global: {}, up: 5, late: 9 } },
}

export async function handler(
  req: IncomingMessage,
  res: ServerResponse,
  next?: () => void,
) {
  const url = (req.url ?? '/').split('?')[0] ?? '/'
  const route = routes[url]
  if (!route) {
    next?.()
    return
  }
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  const perReq = { ...route.input, $global: { ...(route.input.$global as Record<string, unknown>) } }
  try {
    for await (const chunk of route.page.render(perReq)) {
      res.write(chunk)
    }
    res.end()
  } catch (err) {
    if (!res.headersSent) {
      res.statusCode = 500
      res.end('SSR error: ' + (err instanceof Error ? err.message : String(err)))
    } else {
      res.end()
    }
  }
}
