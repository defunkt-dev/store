# @tanstack/marko-store

Marko 6 adapter for [TanStack Store](https://tanstack.com/store). It re-exports the
entire `@tanstack/store` core and adds four Marko tags so a component can read a
store, stay in sync as it changes, and share stores with its children.

## The four tags

- `<store-selector>` — read a value out of a store and re-render when it changes.
- `<store-atom>` — read and write a single-value atom.
- `<store-provider>` — hand a group of stores down to children.
- `<store-context>` — grab those stores from a child in order to write to them.

## Words used in this README

The rest of the doc leans on these, so it's worth pinning them down first.

- **Store** — an object that holds some state and lets you read it, change it, and
  listen for changes: `createStore({ count: 0, name: "Ada" })`.
- **Snapshot** (the store's *value*) — the whole state object right now,
  `{ count: 0, name: "Ada" }`. You read it with `store.state`.
- **Slice** — the one part of the snapshot you actually care about, e.g. the count.
  You pick it with a small function: `s => s.count`.
- **Selector** — that picking function. `<store-selector>` re-renders only when the
  slice the selector returns changes, not on every store change.
- **Atom** — a store for a *single value* (`createAtom(0)`) with a direct setter.
  Reach for it when the state is just one thing.
- **Bundle** — one plain object that groups several stores under names,
  `{ user, cart }`. It's what `<store-provider>` shares. A bundle is one object
  holding many stores — not many providers (see "Sharing stores" below).

## Installation

```sh
npm install @tanstack/store @tanstack/marko-store
```

`marko` is a peer dependency (`^6`).

## Store or atom — which one?

Use a **Store** when your state has more than one field, or when you want to read
just a slice of it and re-render only when that slice changes. Use an **Atom** when
the state is a single value — a number, a flag, a string — that you read and set as
a whole.

The same counter, written both ways:

```marko
import { createStore, createAtom } from "@tanstack/store"

// Atom: the state IS the number. Read and set it directly.
static const countAtom = createAtom(0)
<store-atom/n from=(() => countAtom)>
  <button onClick() { n++ }>${n}</button>
</store-atom>

// Store: the number is one field of an object. Pick it with a selector,
// change it with setState.
static const countStore = createStore({ count: 0, updatedAt: 0 })
<store-selector/count from=(() => countStore) selector=(s => s.count)>
  <button onClick() { countStore.setState(s => ({ count: s.count + 1, updatedAt: Date.now() })) }>
    ${count}
  </button>
</store-selector>
```

Rule of thumb: one value → atom; an object you slice → store.

## Reading a store: `<store-selector>`

### Why not just read the value directly?

A store holds *live* state. Reading `store.state.count` once gives you the number at
that instant and nothing more — when the store changes later, your markup won't.
`<store-selector>` subscribes to the store for you and re-renders only when the slice
you selected changes. So `${store.state.count}` would show a stale `0` forever, while
`<store-selector>` keeps it correct.

### Basic use

```marko
static const store = createStore({ count: 0, name: "Ada" })
<store-selector/count from=(() => store) selector=(s => s.count)>
  <p>Count: ${count}</p>
</store-selector>
```

`from` is a *function* that returns the store, never the store itself. That keeps the
store out of serialized component state, which is what lets the page resume after
server rendering. It must return the same store every call — don't create the store
inside it.

### Attributes

| Attribute  | Required | Description                                                        |
| ---------- | -------- | ------------------------------------------------------------------ |
| `from`     | \*       | Function returning the store/atom (`() => store`).                 |
| `context`  | \*       | Pick a store out of a provided bundle (see Sharing stores). Use instead of `from`. |
| `selector` | no       | Maps the snapshot to the slice you want. Defaults to the whole snapshot. |
| `compare`  | no       | Decides what counts as "changed" for the slice. Defaults to `===`. |
| `key`      | no       | Which provided bundle to read, when using `context`. Defaults to the shared key. |

\* Supply exactly one of `from` or `context`. Passing both throws.

### The optional attributes, by example

No `selector` — track the whole snapshot:

```marko
<store-selector/whole from=(() => store)>
  <pre>${JSON.stringify(whole)}</pre>
</store-selector>
```

`compare` — define what "changed" means. Here, ignore case so `"Ada"` → `"ada"` does
not re-render:

```marko
<store-selector/name
  from=(() => store)
  selector=(s => s.name)
  compare=((a, b) => a.toLowerCase() === b.toLowerCase())
>
  <p>${name}</p>
</store-selector>
```

`key` — choose which provided bundle to read; covered under Sharing stores.

Swapping the `selector` always re-publishes the new slice; `compare` only suppresses
repeat updates coming from store changes, never a deliberate change of selector.

## Writing an atom: `<store-atom>`

Two-way binding for an atom. The bound value is writable: assigning it calls the
atom's setter.

```marko
static const count = createAtom(0)
<store-atom/value from=(() => count)>
  <button onClick() { value++ }>${value}</button>
</store-atom>
```

| Attribute | Required | Description                          |
| --------- | -------- | ------------------------------------ |
| `from`    | yes      | Function returning the atom (`() => a`). |

`<store-atom>` is for atoms — it writes through the atom's `.set`. Hand it a `Store`
and it throws a clear error at render, because a `Store` has no such setter: read a
`Store` with `<store-selector>` and write it with `store.setState(...)`.

> Several writes in one tick collapse into one update. For dependent updates, use the
> function form: `count.set(p => p + 1)`.

## Sharing stores with children: `<store-provider>` + `<store-context>`

### What a bundle is, and how it differs from separate stores

A bundle is one plain object that groups stores under names: `{ user, cart }`.
`<store-provider>` parks that one object where children can find it, and each child
picks the store it wants out of it. This is deliberately **one provider holding many
stores** — not one provider per store. (Two providers under the same name clash; see
Nesting.)

### Is this just Marko's missing context tag?

Close, but not the same. Marko core has no context-provider tag; the way it carries
request-wide values is `$global`, a per-render object the framework hands you.
`<store-provider>` is built on `$global`, but it adds what a store needs: it can
rebuild per-request stores from data so the server and client agree, it groups them as
a bundle, and it has a small recovery step so a child that mounts a beat before the
provider still catches up. So it isn't a general-purpose context tag — it's a
store-specific one. For plain context with non-store values, use Marko's `$global`
directly.

### Can providers be nested?

Yes. Give each provider a distinct `key`, and a child reads whichever bundle it wants
by passing the matching key. Two providers sharing a key throw on purpose — that's
what stops two features from clobbering each other. (Verified by tests.)

```marko
<store-provider key="app" value=(() => ({ session }))>
  <store-provider key="cart" value=(() => ({ cart }))>
    <store-selector/user  key="app"  context=(c => c.session) selector=(s => s.user)/>
    <store-selector/items key="cart" context=(c => c.cart)    selector=(s => s.items)/>
  </store-provider>
</store-provider>
```

### The usual (server-render-ready) shape

Pass the per-request **data** and let the provider build the stores from it. Each
request gets its own fresh stores, and because only the data is serialized — the
stores are rebuilt from it on both the server and the client — the page resumes live
with nothing non-serializable crossing. A bundle can hold any number of stores; each
is read by its own selector and resumes on its own.

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

`user` and `cart` live in one bundle, are each created from their own slice of the
per-request input, and resume independently on the client — incrementing the cart
doesn't touch `user`, and either store rehydrates on its own.

`<store-context>` returns a *getter* for the bundle, so write handlers call `ctx()`
and pick the member: `ctx().user.setState(...)`.

### What about a browser-only app (no server rendering)?

If your app runs only in the browser — a plain single-page app — there's no server
render to match, so you don't need per-request data. Create the stores once when the
module loads and put those same stores in the bundle:

```marko
static const user = createStore({ name: "Ada" })
static const cart = createStore({ items: [] })

<store-provider value=(() => ({ user, cart }))>
  ...
</store-provider>
```

The per-request version above exists only because server rendering needs a fresh set
of stores for every request. A browser-only app has just one session, so module-level
stores are fine.

### `<store-provider>` attributes

| Attribute | Required | Description                                                       |
| --------- | -------- | ----------------------------------------------------------------- |
| `value`   | yes      | Function returning the bundle object (`() => ({ a, b })`).        |
| `key`     | no       | Name this bundle so a selector/context can target it. Defaults to a shared name. |

## Typing the bundle

This section is about TypeScript and editor autocomplete only — it changes nothing at
runtime.

When you read a member with `context=(c => c.user)`, TypeScript can't tell what `c`
is. The bundle's shape doesn't travel across the tag boundary in the current Marko
type tooling, so `c` comes through as `unknown` — TypeScript's "I have no idea what
this is" type. On an `unknown` value, `c.user` has no type, you get no autocomplete,
and if you try to use it as a specific shape TypeScript reports an error.

The fix is to tell TypeScript the shape yourself, in two places:

```marko
// 1) annotate the picker's parameter
<store-selector/name
  context=((c: { user: typeof user; cart: typeof cart }) => c.user)
  selector=(s => s.name)
/>

// 2) assert the getter when writing
(ctx() as { user: typeof user; cart: typeof cart }).user.setState(...)
```

`typeof user` just reuses the store's own type, so you don't retype its shape. Once
annotated, `c.user` and the write are fully typed with working autocomplete. (We
looked hard for a way to make this automatic; in the current Marko toolchain it isn't,
so the annotation is the supported way. It's a typing-ergonomics gap, not a
functionality one.)

## SSR vs client-side: things to know

- **Server-rendered page.** Every tag paints correctly on the first render, and the
  page picks up live updates after it hydrates. Nothing special to do.
- **Browser-only first paint.** When a page is mounted purely in the browser (not
  server-rendered) and a selector reads from a context bundle, that selector can show
  an empty value for the very first frame and then immediately correct itself. The
  provider fills the bundle a beat before the selector reads it, and a built-in
  recovery step catches up right away. Server-rendered pages don't show this.
- **Streaming with `<await>`.** Filling stores as awaited data arrives is a planned
  addition, not shipped yet. The safe rule when it lands: create the stores up front
  and fill them with `setState` when the data resolves — never create a store from
  awaited data.

## License

MIT