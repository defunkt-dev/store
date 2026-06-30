import { defineConfig, devices } from '@playwright/test'

// Mirrors the package e2e config. Pinned to the sandbox's installed Chromium 1194 via
// own e2e/playwright.config.ts picks these specs up under e2e/.
export default defineConfig({
  testDir: '.',
  reporter: [['json', { outputFile: 'pw-results.json' }], ['line']],
  testMatch: /\.spec\.ts$/,
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5189',
    ...devices['Desktop Chrome']
  },
  webServer: {
    command: 'node server.mjs',
    url: 'http://localhost:5189',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
