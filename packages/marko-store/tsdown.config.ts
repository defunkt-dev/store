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
  // entries only, which wipes the hand-authored ".marko" tag subpaths
  // ("./marko.json", "./src/tags/*") — those ship as source, not built output.
  // We maintain "exports" by hand in package.json. publint --strict still runs.
  publint: { strict: true },
})
