/**
 * Tag-level integration tests for <store-selector> and <store-atom>.
 *
 * We call template.mount() directly (the Marko 6 DOM API) instead of using
 * @marko/testing-library: its v6 detection (`!template.renderSync`) misfires on
 * Marko 6 browser templates — which DO have renderSync — and takes the Marko
 * 3/4 path, calling a render() that browser templates don't expose. The same
 * workaround is used by @tanstack/marko-virtual. @marko/vite compiles the .marko
 * fixtures to browser templates in jsdom, and waitFor() retries until Marko's
 * rAF-based reactive flush completes.
 *
 * Each test creates a FRESH store/atom and passes it as a thunk (from: () => x).
 * Client mounts never serialize, so a test-created thunk is fine here; the SSR
 * tests (ssr.test.ts) cover the resume/serialization path separately.
 */

import { afterEach, describe, expect, test } from 'vitest'
import { waitFor } from '@testing-library/dom'
import { createAtom, createStore } from '../src/index'
import SelectorHostTemplate from './fixtures/selector-host.marko'
import AtomHostTemplate from './fixtures/atom-host.marko'
import SourceSwapHostTemplate from './fixtures/selector-source-swap-host.marko'
import SelectorSwapHostTemplate from './fixtures/selector-selector-swap-host.marko'

const SelectorHost = SelectorHostTemplate as any
const AtomHost = AtomHostTemplate as any
const SourceSwapHost = SourceSwapHostTemplate as any
const SelectorSwapHost = SelectorSwapHostTemplate as any

const instances: Array<{ destroy: () => void }> = []

function mount(Template: any, input: Record<string, unknown> = {}) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  instances.push(Template.mount(input, container))
  return container
}

afterEach(() => {
  instances.forEach((i) => i.destroy())
  instances.length = 0
  document.body.innerHTML = ''
})

const cell = (el: Element, id: string) =>
  el.querySelector(`[data-testid='${id}']`)?.textContent ?? null

describe('<store-selector> read path', () => {
  test('seeds from the store and updates when the selected slice changes', async () => {
    const store = createStore({ count: 5, other: 0 })
    const el = mount(SelectorHost, {
      from: () => store,
      selector: (s: { count: number }) => s.count,
    })
    expect(cell(el, 'value')).toBe('5')

    store.setState((s) => ({ ...s, count: s.count + 1 }))
    await waitFor(() => expect(cell(el, 'value')).toBe('6'))
  })

  test('dedupes when an unrelated field changes', async () => {
    const store = createStore({ count: 5, other: 0 })
    const el = mount(SelectorHost, {
      from: () => store,
      selector: (s: { count: number }) => s.count,
    })
    await waitFor(() => expect(cell(el, 'value')).toBe('5'))

    // The selected slice (count) is unchanged, so the tag must not re-render.
    store.setState((s) => ({ ...s, other: s.other + 99 }))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(cell(el, 'value')).toBe('5')
  })
})

describe('<store-atom> write path', () => {
  test('echoes a write back through valueChange without looping', async () => {
    const atom = createAtom(7)
    const el = mount(AtomHost, { from: () => atom })
    expect(cell(el, 'value')).toBe('7')
    ;(el.querySelector("[data-testid='inc']") as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )

    await waitFor(() => expect(cell(el, 'value')).toBe('8'))
    expect(atom.get()).toBe(8)
  })
})

describe('<store-selector> onUpdate', () => {
  test('resubscribes and re-seeds when the source store changes', async () => {
    const storeA = createStore({ count: 1, other: 0 })
    const storeB = createStore({ count: 100, other: 0 })
    const el = mount(SourceSwapHost, { storeA, storeB })
    expect(cell(el, 'value')).toBe('1')

    // Swap the source: a new resolved store reaches onUpdate, which unsubscribes
    // from the old one, re-seeds from the new one, and subscribes to it.
    ;(el.querySelector("[data-testid='swap']") as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    await waitFor(() => expect(cell(el, 'value')).toBe('100'))

    // Updates to the new source now flow through.
    storeB.setState((s) => ({ ...s, count: 101 }))
    await waitFor(() => expect(cell(el, 'value')).toBe('101'))

    // The old source is no longer observed.
    storeA.setState((s) => ({ ...s, count: 999 }))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(cell(el, 'value')).toBe('101')
  })

  test('re-seeds when the selector changes against the same source', async () => {
    const store = createStore({ count: 5, other: 42 })
    const el = mount(SelectorSwapHost, { from: () => store })
    expect(cell(el, 'value')).toBe('5')

    // Swap the selector: same source, so onUpdate re-seeds with the new selection.
    ;(
      el.querySelector("[data-testid='swap-selector']") as HTMLElement
    ).dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await waitFor(() => expect(cell(el, 'value')).toBe('42'))

    // The live subscription reflects the new selector on the next change.
    store.setState((s) => ({ ...s, other: 43 }))
    await waitFor(() => expect(cell(el, 'value')).toBe('43'))
  })
});
