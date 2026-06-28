# @tanstack/marko-store

Marko 6 adapter for [TanStack Store](https://tanstack.com/store).

This package re-exports the entire `@tanstack/store` core and adds four Marko
tags: two for reading and writing a store you already have, and two for sharing
a set of stores through context so deep children can read and write them without
prop-drilling.

- `<store-selector>` — read a value out of a store (or atom) and re-render only
  when the slice you select changes.
- `<store-atom>` — two-way binding for an atom created with `createAtom`.
- `<store-provider>` — make a bundle of stores available to everything below it.
- `<store-context>` — reach that bundle from a child to write to it.

## Installation

```sh
npm install @tanstack/store @tanstack/marko-store
```

`marko` is a peer dependency (`^6`).

## Sources are passed as thunks

`<store-selector>` and `<store-atom>` take their source through a `from`
function — `from=(() => store)`, never `from=store`. A function keeps the
(non-serializable) store inside its closure, which is what lets a component
resume on the client after server rendering; passing the store object directly
would put it into serializable component state and break resume. A `from` thunk
must return the same store instance every call — don't create the store inside
it. (`<store-provider>`'s `value` is different: that's where you build the
bundle, and under SSR it creates the per-request stores from data — see Context.)

## `<store-selector>`

Reads a value out of a store or atom and keeps it in sync. With a `selector`,
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
| `from`     | \*       | Thunk returning the store/atom (`() => store`).                    |
| `context`  | \*       | Pick a store out of a provided bundle (see Context). Use instead of `from`. |
| `selector` | no       | Maps the snapshot to the slice you want. Defaults to the snapshot. |
| `compare`  | no       | Equality check for the selected slice. Defaults to `===`.          |
| `key`      | no       | Which provided bundle to read, when using `context`. Defaults to the shared key. |

\* Supply exactly one of `from` or `context`. Passing both throws.

Without a `selector` it tracks the whole snapshot. The tag returns the selected
value, so `<store-selector/x .../>` binds `x` for use in the body. Swapping the
`selector` always re-publishes the new slice; `compare` only suppresses repeat
updates coming from store mutations, never a deliberate change of selector.

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
it with `<store-selector>` and write with `store.setState(...)`. Handing
`<store-atom>` a `Store` throws a clear error at render rather than failing on
the first write.

> Burst writes in a single tick collapse to one update. To apply several
> dependent updates synchronously, use the updater form: `atom.set(p => p + 1)`.

## Context: `<store-provider>` and `<store-context>`

When children far down the tree need the same stores, put one `<store-provider>`
above them holding a **bundle** — a plain object of stores — and let descendants
read and write members of it. This is a single provider with an object inside,
not one provider per store.

Pass the per-request **data** and let the provider build the stores from it. Each
request gets its own fresh stores, and because only the data is serialized — the
stores are rebuilt from it on both the server and the client — the page resumes
live with nothing non-serializable crossing. A bundle can hold any number of
stores; each is read by its own selector and resumes on its own.

```marko
import { createStore } from "@tanstack/store"

export interface Input {
  user: { name: string }
  cart: { items: Array<string> }
}

<store-provider value=(() => ({
  user: createStore(input.user),
  cart: createStore(input.cart),
}))>
  <!-- two stores, two independent selectors -->
  <store-selector/name context=(c => c.user) selector=(s => s.name)>
    <p>${name}</p>
  </store-selector>

  <store-selector/itemCount context=(c => c.cart) selector=(s => s.items.length)>
    <p>${itemCount} in cart</p>
  </store-selector>

  <!-- write a member by reaching the bundle through store-context -->
  <store-context/ctx>
    <button onClick() { ctx().cart.setState(s => ({ ...s, items: [...s.items, "x"] })) }>
      add to cart
    </button>
  </store-context>
</store-provider>
```

`user` and `cart` live in one bundle, are each created from their own slice of
the per-request input, and resume independently on the client — incrementing the
cart doesn't touch `user`, and either store rehydrates on its own. (For a
client-only app, drop the `Input` and put existing stores in the bundle directly:
`value=(() => ({ user, cart }))`.)

`<store-provider>` attributes:

| Attribute | Required | Description                                                       |
| --------- | -------- | ----------------------------------------------------------------- |
| `value`   | yes      | Thunk returning the bundle object (`() => ({ a, b })`).           |
| `key`     | no       | Name this bundle so selectors/contexts can target it. Defaults to a shared key. |

`<store-context>` returns a getter for the bundle, so write handlers call
`ctx()` and pick the member: `ctx().user.setState(...)`. Use distinct `key`s if
you ever nest more than one provider, so the second doesn't collide with the
first (a duplicate key throws).

### Typing the bundle

The bundle's shape is not inferred at the call site by the current Marko
type-checker, so annotate the picker and assert the getter when you want types:

```marko
<store-selector/name
  context=((c: { user: typeof user; cart: typeof cart }) => c.user)
  selector=(s => s.name)
/>
...
ctx() as { user: typeof user; cart: typeof cart }
```

## License

MIT