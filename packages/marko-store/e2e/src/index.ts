// TS server entry. Importing the .marko page from here (rather than ssrLoadModule-ing the
// .marko directly) is what makes @marko/vite treat it as an entry: the generated server entry
// runs addAssets, injecting the browser <script> tags so the page resumes on the client.
// Without that, the page renders but never resumes (no client JS). This mirrors @marko/vite's
// own isomorphic dev-server fixtures and the marko-query e2e.
//
// Marko 6's render(input) is an async iterable that must be consumed (the render(input, res)
// form does not drive the stream here and the request hangs). The store proof needs no
// per-request server state, so $global is empty -- per-request transport is a later phase.
import page from './page.marko'
import type { IncomingMessage, ServerResponse } from 'node:http'

// The ambient *.marko declaration (tests/marko.d.ts) models only the browser mount(); the
// server template's render() is supplied by @marko/vite at runtime, so it is typed here -- the
// same reason the SSR tests cast their imports for render().
type ServerTemplate = {
  render: (input: { $global: Record<string, unknown> }) => AsyncIterable<string>
}

const routes: Record<string, { page: ServerTemplate }> = {
  '/': { page: page as unknown as ServerTemplate },
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
  for await (const chunk of route.page.render({ $global: {} })) {
    res.write(chunk)
  }
  res.end()
}
