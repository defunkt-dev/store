# marko-store e2e (resume liveness)

A real-browser proof that an SSR'd page using `<store-selector>` and `<store-atom>` resumes and
stays reactive. jsdom can render and serialize but cannot faithfully reproduce Marko 6's client
resume, so this round-trip lives here (Playwright + real Chromium) rather than in the vitest
suite.

## What it proves

`store-resume-liveness.spec.ts` loads the SSR'd page and checks, in order:

1. **The page resumed** -- a store-independent `data-testid="resumed"` marker flips from `no`
   (server) to `yes` (client `onMount`). This is the precondition; if it stays `no`, the page
   never resumed and any further result is inconclusive.
2. **Seeded values rendered** -- `selector-count` is `5` and `atom-value` is `7`, from the
   module-singleton `createStore({ count: 5 })` / `createAtom(7)`.
3. **Selector subscription is live** -- clicking a button that calls `counterStore.setState`
   from outside any tag moves `selector-count` to `6`.
4. **Atom write-back is live** -- clicking the atom button (`value++`) flows through the tag's
   `valueChange` into `countAtom.set` and moves `atom-value` to `8`.
5. **No serialization crash** -- no `pageerror` / `console.error` during render or resume.

A `resumed=yes` result with a stale value would mean a tag is inert after resume (the failure
this is designed to catch), distinct from a `resumed=no` setup failure.

## Architecture

- `server.mjs` -- Vite (middleware mode) + `@marko/vite`, on port 5188. It `ssrLoadModule`s the
  JS entry `src/index.js` (not the `.marko` directly); only the JS-entry path makes `@marko/vite`
  inject the client `<script>` tags that drive resume.
- `src/index.js` -- routes `/` to the page and consumes Marko's async `render(...)` iterable.
- `src/page.marko` -- the HTML wrapper, the resume marker, and the two store scenarios. The
  package's `marko.json` makes `<store-selector>` / `<store-atom>` available here.
- `src/store.js` -- the module-singleton stores.
- `playwright.config.ts` -- boots `server.mjs` and runs every `*.spec.ts` in real Chromium.

`server.mjs` aliases `@tanstack/store` to its source so the suite runs without first building
the store package.

## Running

From the package root (`packages/marko-store`):

```sh
pnpm exec playwright install chromium   # one-time, downloads the browser
pnpm run test:e2e
```

`test:e2e` runs `playwright test --config e2e/playwright.config.ts`. The config starts the dev
server automatically (and reuses one if it is already running).
