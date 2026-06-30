# Marko Store — streaming

Streaming server-computed per-request data into a live store with
`<stream-store-provider>`. The home page (`/`) shows the in-order case: a store
born from a value that arrives inside a late `<await>`, painted server-side with
no flash and live after resume. The `/out-of-order` page wraps each `<await>` in
`<try>` with a `<@placeholder>`, so the fast block paints before the slow one
while each store stays live.

Note the server gives each request its own fresh `$global`: born-with-data parks
the store on `$global`, so requests must not share it.

This is a development demonstration, run with the Marko Vite dev server. It is
NOT a deployable production server — real Marko production uses `@marko/run`.

To run this example:

- `npm install`
- `npm run dev`
- open `/` and `/out-of-order`
