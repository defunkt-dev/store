import perreqPage from './perreq-page.marko'
import multiPage from './multi-page.marko'

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
  '/': { page: perreqPage as unknown as ServerTemplate, input: { initial: { count: 42 } } },
  '/multi': { page: multiPage as unknown as ServerTemplate, input: {} },
}

export async function handler(req: Req, res: Res, next?: () => void) {
  const url = (req.url ?? '/').split('?')[0] ?? '/'
  const route = routes[url]
  if (!route) { next?.(); return }
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // Fresh $global per request — never share the resume/data box across requests.
  const input = { ...route.input, $global: {} }
  for await (const chunk of route.page.render(input)) res.write(chunk)
  res.end()
}
