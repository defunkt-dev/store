# @tanstack/marko-store

Marko 6 adapter for [TanStack Store](https://tanstack.com/store).

This package re-exports the entire `@tanstack/store` core and adds two Marko
tags that subscribe a component to a store and re-render only when the value
you select actually changes.

## Installation

```sh
npm install @tanstack/store @tanstack/marko-store
```

`marko` is a peer dependency (`^6`).

## Sources are always passed as thunks

Every tag takes its source through a `from` function — `from=(() => store)`,
never `from=store`. A registered function keeps the (non-serializable) store
inside its closure, which is what lets a component resume on the client after
server rendering. Passing the store object directly would put it into
serializable component state and break resume. `from` must return the same
store instance every call (don't create the store inside the thunk).

## `<store-selector>`

Reads a value out of any store or atom and keeps it in sync. With a `selector`,
the tag re-renders only when the selected slice changes.

```marko
import { createStore } from "@tanstack/store"

static const store = createStore({ count: 0, name: "Ada" })

<store-selector/count from=(() => store) selector=(s => s.count)>
  <p>Count: ${count}</p>
</store-selector>
```

| Attribute  | Required | Description                                                        |
| ---------- | -------- | ------------------------------------------------------------------ |
| `from`     | yes      | Thunk returning the store/atom (`() => store`).                    |
| `selector` | no       | Maps the snapshot to the slice you want. Defaults to the snapshot. |
| `compare`  | no       | Equality check for the selected slice. Defaults to `===`.          |

Without a `selector` it tracks the whole snapshot. The tag returns the selected
value, so `<store-selector/x .../>` binds `x` for use in the body.

## `<store-atom>`

Two-way binding for an atom created with `createAtom`. The returned value is
writable: assigning it calls the atom's setter.

```marko
import { createAtom } from "@tanstack/store"

static const count = createAtom(0)

<store-atom/value from=(() => count)>
  <button onClick() { value++ }>${value}</button>
</store-atom>
```

| Attribute | Required | Description                          |
| --------- | -------- | ------------------------------------ |
| `from`    | yes      | Thunk returning the atom (`() => a`). |

`<store-atom>` is for atoms (it writes via `.set`). For a writable `Store`, read
it with `<store-selector>` and write with `store.setState(...)` directly.

> Burst writes in a single tick collapse to one update. To apply several
> dependent updates synchronously, use the updater form: `atom.set(p => p + 1)`.

## License

MIT
