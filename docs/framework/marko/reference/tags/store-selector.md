---
id: store-selector
title: "<store-selector>"
---

# Tag: `<store-selector>`

Subscribes to a store or atom, projects a slice of it, and re-renders when that slice changes. Works in two modes: `from` (a store passed directly) or `context` (a member of the provided bundle). Binds the selected value.

```marko
<!-- from mode -->
<store-selector/count from=() => cartStore selector=(s) => s.items.length>
<p>${count} items</p>

<!-- context mode -->
<store-selector/count context=(b) => b.cart selector=(s) => s.items.length>
```

## Type parameters

- **`TSource`** — the snapshot type of the source store or atom.
- **`TSelected`** — the projected slice type. Defaults to `TSource` when no `selector` is given.

## Attributes

- **`from`** — `() => { get(); subscribe() }` (optional). A thunk returning the source store or atom directly. Mutually exclusive with `context`.
- **`context`** — `(bundle) => { get(); subscribe() }` (optional). Selects the source from the provided bundle. Mutually exclusive with `from`. Annotate the parameter in typed projects, e.g. `context=(b: any) => b.cart`.
- **`key`** — `string` (optional, default `"__tanstack_store_context"`). The context key to read in `context` mode. Must match the provider's key.
- **`selector`** — `(snapshot: TSource) => TSelected` (optional, default identity). Projects the slice to track.
- **`compare`** — `(a: TSelected, b: TSelected) => boolean` (optional, default `===`). Equality check used to drop redundant updates.

## Tag variable

The current selected value, typed `TSelected | undefined`. It is `undefined` only at the brief moment on resume before a context-mode provider has parked its bundle; the tag recovers automatically and updates once the bundle is available.

## Behavior

Passing both `from` and `context` throws. The value is seeded at render (null-tolerant in context mode), then kept live by a subscription established on mount. In context mode the tag also listens on the internal publish bus, so it attaches to the store the moment the provider parks it during streaming or resume. Changing the source or swapping the `selector` re-projects; `compare` gates only store mutations, never a deliberate selector change.
