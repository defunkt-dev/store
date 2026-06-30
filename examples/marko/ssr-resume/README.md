# Marko Store — ssr-resume

A server-rendered page: the server paints the store's value, then the page
resumes and the store stays live (external writes and the atom write work after
load). The store is a module singleton and is rebuilt on each side, so no live
store is ever serialized.

This is a development demonstration, run with the Marko Vite dev server. It is
NOT a deployable production server — real Marko production uses `@marko/run`.

To run this example:

- `npm install`
- `npm run dev`
