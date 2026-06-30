import inorderPage from './inorder-page.marko'
import outoforderPage from './outoforder-page.marko'

// Minimal structural types for the Node req/res the dev server passes in — keeps this small
// example free of an @types/node dependency. The real Node objects satisfy these structurally.
interface Req { url?: string }
interface Res {
  statusCode: number
  headersSent: boolean
  setHeader(name: string, value: string): void
  write(chunk: string): void
  end(data?: string): void
}

type ServerTemplate = { render: (input: Record<string, unknown>) => AsyncIterable<string> }

const routes: Record<string, { page: ServerTemplate; input: Record<string, unknown> }> = {
  '/': { page: inorderPage as unknown as ServerTemplate, input: { value: 77 } },
  '/out-of-order': { page: outoforderPage as unknown as ServerTemplate, input: { slow: 33, fast: 44 } },
}

export async function handler(req: Req, res: Res, next?: () => void) {
  const url = (req.url ?? '/').split('?')[0] ?? '/'
  const route = routes[url]
  if (!route) { next?.(); return }
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // Fresh $global per request: born-with-data parks the store on $global, so each request MUST
  // get its own box or concurrent requests would see each other's stores.
  const input = { ...route.input, $global: {} }
  try {
    res.statusCode = 200
    for await (const chunk of route.page.render(input)) res.write(chunk)
    res.end()
  } catch (err) {
    // A throw before the first byte (e.g. a duplicate key caught outside <try>) becomes a clean
    // 500; once streaming has started the status is already sent, so just end.
    if (!res.headersSent) {
      res.statusCode = 500
      res.end('SSR error: ' + (err instanceof Error ? err.message : String(err)))
    } else {
      res.end()
    }
  }
}
