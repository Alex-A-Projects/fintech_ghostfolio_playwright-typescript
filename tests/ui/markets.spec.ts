import { test, expect } from '../../fixtures/testFixtures';

/**
 * Markets page tests — covers /en/markets (asset browser + benchmark list).
 */

test.describe('Markets page', () => {
  test('page loads with the heading visible', async ({ marketsPage }) => {
    await marketsPage.assertLoaded();
  });

  test('markets page renders at least one asset card or row', async ({ marketsPage }) => {
    const count = await marketsPage.getMarketItemCount();
    expect(count).toBeGreaterThan(0);
  });

  test('markets page renders without JS errors', async ({ marketsPage }) => {
    const h1 = marketsPage.page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('markets page has a non-empty <title>', async ({ marketsPage }) => {
    const title = await marketsPage.page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});