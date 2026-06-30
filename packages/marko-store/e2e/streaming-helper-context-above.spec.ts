import { expect, test } from '@playwright/test'

// Composition rule: <store-context> grabs the bundle off the shelf AT RENDER and throws if the
// shelf is empty. Placed ABOVE the streamed helper, the box is still empty at that point, so it
// throws during the shell render -> a clean 500 (before any bytes are streamed). This documents
// that you cannot grab a streamed store via <store-context> above where the helper creates it.
test('store-context above the streamed helper fails fast', async ({ request }) => {
  const res = await request.get('/context-above')
  expect(res.status()).toBe(500)
  expect(await res.text()).toContain('without a <store-provider> above it')
})
