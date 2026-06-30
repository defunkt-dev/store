---
id: store-atom
title: "<store-atom>"
---

# Tag: `<store-atom>`

Binds a single writable atom from `createAtom()` as a two-way value: it reads the atom's current value and writes back through the atom's `set`. Use it for a standalone writable value; for a `Store` (from `createStore`), read it with `<store-selector>` instead.

```marko
<store-atom/qty from=() => qtyAtom>
<p>Quantity: ${qty}</p>
```

## Type parameters

- **`T`** — the atom's value type.

## Attributes

- **`from`** — `() => { get(); set(); subscribe() }` (required). A thunk returning the atom (from `createAtom()`). The atom must have a `set` method; a `Store` does not and will throw.

## Tag variable

The atom's current value, typed `T`. The tag exposes a `value`/`valueChange` pair, so it is two-way bindable — bind it to a variable with `value:=` and assignments write back through the atom's `set`.

## Behavior

The value is seeded from `from().get()` at render and kept live by a subscription on mount, so it updates whenever the atom changes from anywhere. Writes go through `from().set(next)`. If `from()` returns something without a `set` method (such as a `Store`), the tag throws with guidance to use `<store-selector>`.
