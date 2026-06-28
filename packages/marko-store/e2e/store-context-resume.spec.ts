import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

// jsdom cannot replay Marko's resume, so the context delivery path's wake-up behavior is
// proven here, in real Chromium, against the real @marko/vite dev-server resume pipeline.
// A store-independent resume marker (data-testid="resumed") confirms the page resumed before
// the tag output is judged: "yes" only after a client onMount runs.
const isDevServerNoise = (e: string) => /websocket|ws:\/\/|\[vite\]|favicon/i.test(e)

function trackErrors(page: Page) {
  const errors: Array<string> = []
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console.error: ' + m.text())
  })
  return () => errors.filter((e) => !isDevServerNoise(e))
}

test('context chain resumes and stays live (selector seeds, external + context writes propagate)', async ({
  page,
}) => {
  const realErrors = trackErrors(page)
  await page.goto('/context')

  // The empty-shelf moment is fatal without the guard; this asserts the page actually resumes.
  await expect(
    page.getByTestId('resumed'),
    'page did not resume -- client JS did not run',
  ).toHaveText('yes')

  // Seeded via the context picker (createStore({ count: 5 })), no blank.
  await expect(page.getByTestId('selector-count')).toHaveText('5')

  // Live: an external store mutation propagates to the context-fed selector after resume.
  await page.getByTestId('external-inc').click()
  await expect(page.getByTestId('selector-count')).toHaveText('6')

  // Live: a <store-context> write (grab the store in a handler, setState) propagates.
  await page.getByTestId('ctx-reset').click()
  await expect(page.getByTestId('selector-count')).toHaveText('0')

  expect(realErrors(), 'client errors during resume').toEqual([])
})

test('per-request data rebuilds from the serialized payload on resume and stays live', async ({
  page,
}) => {
  const realErrors = trackErrors(page)
  await page.goto('/context-perreq')

  await expect(page.getByTestId('resumed')).toHaveText('yes')
  // The provider did createStore(input.initial={count:42}); the client rebuilds from the
  // serialized data, not a serialized live store.
  await expect(page.getByTestId('selector-count')).toHaveText('42')

  await page.getByTestId('ctx-inc').click()
  await expect(page.getByTestId('selector-count')).toHaveText('43')

  expect(realErrors(), 'client errors during resume').toEqual([])
})
