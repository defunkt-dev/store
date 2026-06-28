// TS server entry. Importing the .marko pages here (rather than ssrLoadModule-ing them
// directly) is what makes @marko/vite treat them as entries and inject the browser <script>
// tags so the pages resume on the client.
import page from './page.marko'
import contextPage from './context-page.marko'
import contextPagePerreq from './context-page-perreq.marko'
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
  for await (const chunk of route.page.render(route.input)) {
    res.write(chunk)
  }
  res.end()
}
