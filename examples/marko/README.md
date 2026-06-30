# Marko examples for TanStack Store

These mirror the sibling adapter examples (react, svelte, …) using
`@tanstack/marko-store`.

Five client-only parity examples — `stores`, `simple`, `atoms`, `store-actions`,
`store-context` — match the scenarios the other frameworks ship. Each is a
browser-only SPA: `vite.config.ts` uses `marko({ linked: false })` (Marko + Vite
is SSR-first, so a client-only build needs `linked: false`), and `src/index.ts`
mounts the app.

Three Marko-specific SSR examples — `ssr-resume`, `ssr-per-request-multi`,
`streaming` — show server render + resume, per-request data rebuilt on the
client, and streaming a store into a late `<await>` (born-with-data, in-order and
out-of-order). Each runs a small Marko Vite dev server (`node server.mjs`); open
the routes named in its README.

Those three SSR servers are development demonstrations, not deployable production
servers. Real Marko production uses `@marko/run`; a dedicated `@marko/run`
example will be added separately.

In this monorepo you do not install per example. Add `examples/marko/**` to
`pnpm-workspace.yaml`, run `pnpm install` once at the root, then start an example
by folder (`cd examples/marko/<name> && pnpm dev`) or by name
(`pnpm --filter @tanstack/store-example-marko-<name> dev`).
