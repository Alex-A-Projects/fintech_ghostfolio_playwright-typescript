import { test, expect } from '../../fixtures/testFixtures';

/**
 * Resources page tests — covers /en/resources (links to articles / blog).
 */

test.describe('Resources page', () => {
  test('page loads with the heading visible', async ({ resourcesPage }) => {
    await resourcesPage.assertLoaded();
  });

  test('page has a non-empty <title>', async ({ resourcesPage }) => {
    const title = await resourcesPage.page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title).toMatch(/Resources|Ghostfolio/);
  });

  test('the page contains at least one resource link (article/anchor)', async ({ page }) => {
    // The SPA renders the resource cards asynchronously. Re-navigate
    // fresh and wait for the body to have rendered.
    await page.goto('https://ghostfol.io/en/resources', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
    await page.locator('h2').first().waitFor({ state: 'visible', timeout: 30_000 });
    const links = await page.locator('main a').count();
    expect(links).toBeGreaterThan(0);
  });
});