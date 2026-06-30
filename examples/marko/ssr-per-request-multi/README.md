# Marko Store — ssr-per-request-multi

Two pages. The home page (`/`) rebuilds a store from per-request DATA passed by
the route: the data crosses in the serialized payload and the store is rebuilt on
each side. The `/multi` page parks a bundle of two stores in one provider, read
independently, with a context write targeting one.

This is a development demonstration, run with the Marko Vite dev server. It is
NOT a deployable production server — real Marko production uses `@marko/run`.

To run this example:

- `npm install`
- `npm run dev`
- open `/` and `/multi`
