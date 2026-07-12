# consumer-check

Confirms that `@tanstack/marko-store`'s tags type correctly when consumed as a
**real, declared dependency** — without publishing anything. Everything stays in
your monorepo.

The point being tested: with the library listed in this package's `dependencies`,
writing a two-way tag value (`value++`) should type-check cleanly. If it reports
`TS2540: Cannot assign to 'value' because it is a read-only property`, the concern
is real; if it's clean, it's confirmed.

## Run

1. Install, so the package manager links `marko-store` into `node_modules` locally
   (no registry involved):

       <your package manager> install

   This package declares `"@tanstack/marko-store": "workspace:*"`. If you are NOT
   on the workspace protocol, change that line to `"file:../marko-store"` (adjust
   the relative path to wherever the adapter lives).

2. Make sure the adapter's `dist` is built first — its `marko.json` `exports`
   points at `./dist/tags`:

       # in the marko-store package
       <run its build / mtc>

3. Type-check this package:

       npm run check      # -> marko-type-check -p tsconfig.json

No `TS2540` on `value++` = confirmed (the tag is writable for a real consumer).
Delete this package afterward; nothing leaves your machine.

Note: edit `src/page.marko` so the `<store-atom>` props match the real API. Only
the bare-name usage and the assignment to its value matter for the check.
