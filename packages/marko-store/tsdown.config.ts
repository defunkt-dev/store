import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm', 'cjs'],
  unbundle: true,
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  fixedExtension: false,
  // NOTE: unlike react-store, `exports: true` is intentionally NOT set here.
  // tsdown's `exports: true` rewrites package.json "exports" from the built
  // entries only, which would wipe the hand-authored "./marko.json" subpath.
  // The Marko tags are built separately by `marko-type-check` (see the "build"
  // script) into dist/tags and are resolved via marko.json's "exports" field,
  // not via package.json. We maintain package.json "exports" by hand.
  // publint --strict still runs. tsdown's `clean` wipes dist, so `build` runs
  // tsdown first (index) and marko-type-check second (tags) — order matters.
  publint: { strict: true },
})
