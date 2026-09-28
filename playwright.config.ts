import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the Ghostfolio test suite.
 *
 * Test layout:
 *   - tests/ui          - Browser tests against the marketing site + dashboard
 *   - tests/api         - API tests against https://ghostfol.io/api/v1/*
 *   - tests/database    - PostgreSQL tests against a local Docker Ghostfolio
 *
 * UI tests run serially because they share the public demo host. API tests
 * are independent and run fully parallel. Database tests target a local
 * container — set GHOSTFOLIO_DB_URL to override the connection string.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.spec.ts'],
  globalSetup: './global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  reportSlowTests: { max: 5, threshold: 30_000 },
  use: {
    baseURL: 'https://ghostfol.io',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    // Locale + timezone for tests that read locale-dependent UI strings.
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});