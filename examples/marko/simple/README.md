# Marko Store — simple

A multi-component counter split across files. `Increment.marko` writes with
`store.setState`; `Display.marko` reads a slice with `<store-selector>`;
`App.marko` composes them around a module-level store in `store.ts`.

To run this example:

- `npm install`
- `npm run dev`
