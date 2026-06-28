/**
 * Client (jsdom) tests for the context delivery path: <store-provider> + the
 * <store-selector context=...> picker + <store-context> write handle. Mounts via
 * Template.mount (the Marko 6 DOM API), same as the package's tags.test.ts. Each test
 * passes a FRESH store via input; client mounts never serialize, so that is safe.
 */
import { afterEach, describe, expect, test } from 'vitest'
import { waitFor } from '@testing-library/dom'
import { createStore } from '../src/index'
import SelectorHostTemplate from './fixtures/ctx-selector-host.marko'
import WriteHostTemplate from './fixtures/ctx-write-host.marko'
import NoProviderHostTemplate from './fixtures/ctx-no-provider-host.marko'

const SelectorHost = SelectorHostTemplate as any
const WriteHost = WriteHostTemplate as any
const NoProviderHost = NoProviderHostTemplate as any

const instances: Array<{ destroy: () => void }> = []
function mount(T: any, input: Record<string, unknown> = {}) {
  const c = document.createElement('div')
  document.body.appendChild(c)
  instances.push(T.mount(input, c))
  return c
}
afterEach(() => {
  instances.forEach((i) => i.destroy())
  instances.length = 0
  document.body.innerHTML = ''
})
const cell = (el: Element, id: string) =>
  el.querySelector(`[data-testid='${id}']`)?.textContent ?? null

describe('<store-selector context> read path', () => {
  test('seeds from the bundle member with no blank, and reacts to external mutation', async () => {
    const store = createStore({ count: 5 })
    const el = mount(SelectorHost, { store })
    expect(cell(el, 'count')).toBe('5') // seeded at render via the picker — no blank
    store.setState(() => ({ count: 6 }))
    await waitFor(() => expect(cell(el, 'count')).toBe('6')) // live subscription
  })

  test('context-mode with no provider mounts without crashing (empty shelf tolerated)', () => {
    const el = mount(NoProviderHost, {}) // would throw here if the guard were missing
    expect(cell(el, 'count')).toBe('')
  })
})

describe('<store-context> write path', () => {
  test('grabs the bundle in a handler and setState propagates to the selector', async () => {
    const store = createStore({ count: 5 })
    const el = mount(WriteHost, { store })
    expect(cell(el, 'count')).toBe('5')
    ;(el.querySelector("[data-testid='btn']") as HTMLButtonElement).click()
    await waitFor(() => expect(cell(el, 'count')).toBe('99'))
  })
})
