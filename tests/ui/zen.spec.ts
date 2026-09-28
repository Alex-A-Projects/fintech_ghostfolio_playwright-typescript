import { test, expect } from '../../fixtures/testFixtures';

/**
 * Zen page tests — covers /en/zen (no-monetary-values view).
 *
 * NOTE: /en/zen redirects to /en/start on the public Ghostfolio demo
 * (the Zen mode requires authentication). The page object allows for
 * either URL.
 */

test.describe('Zen page', () => {
  test('page loads (or redirects to /en/start)', async ({ page, zenPage }) => {
    await zenPage.waitForAppReady();
    const url = page.url();
    expect(url).toMatch(/\/(zen|start|home)/);
  });

  test('the page does not 404', async ({ zenPage }) => {
    const title = await zenPage.page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toMatch(/^404/);
  });

  test('the marketing header is present on the redirect target', async ({ zenPage }) => {
    await expect(zenPage.logoLink).toBeVisible();
  });
});