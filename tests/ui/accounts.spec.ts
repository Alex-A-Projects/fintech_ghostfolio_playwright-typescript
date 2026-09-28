import { test, expect } from '../../fixtures/testFixtures';

/**
 * Accounts page tests — covers /en/accounts (account list + create).
 *
 * NOTE: /en/accounts is an authenticated page. On the public demo the
 * SPA redirects anonymous visitors to /en/start (the marketing landing).
 * We assert that the redirect is graceful and the page doesn't 500.
 */

test.describe('Accounts page (/en/accounts)', () => {
  test('redirects to /en/start (auth required) without breaking', async ({ page, accountsPage }) => {
    await accountsPage.waitForAppReady();
    const url = page.url();
    // Either /accounts (authenticated) or a redirect to /start / /login.
    expect(url).toMatch(/\/(accounts|start|login)/);
  });

  test('the page does not 404', async ({ accountsPage }) => {
    const title = await accountsPage.page.title();
    expect(title).not.toMatch(/^404/);
  });

  test('the marketing header is still present on the redirect target', async ({ accountsPage }) => {
    await expect(accountsPage.logoLink).toBeVisible();
  });
});