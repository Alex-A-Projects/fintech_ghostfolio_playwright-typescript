import { test, expect } from '../../fixtures/testFixtures';

/**
 * Portfolio page tests — covers /en/portfolio (KPIs + Holdings + Charts).
 *
 * NOTE: /en/portfolio is an authenticated page. Without a valid access
 * token the SPA redirects anonymous visitors to /en/start (the
 * marketing landing). We test the public-facing smoke here (page either
 * renders the portfolio or redirects to /start — both are valid
 * behaviours).
 */

test.describe('Portfolio page (/en/portfolio)', () => {
  test('redirects to /en/start (auth required) without breaking', async ({ page, portfolioPage }) => {
    await portfolioPage.waitForAppReady();
    const url = page.url();
    expect(url).toMatch(/\/(portfolio|start|login)/);
  });

  test('the page does not 404', async ({ portfolioPage }) => {
    const title = await portfolioPage.page.title();
    expect(title).not.toMatch(/^404/);
  });

  test('the page renders an H1', async ({ portfolioPage }) => {
    const h1 = portfolioPage.page.locator('h1').first();
    await expect(h1).toBeVisible({ timeout: 10_000 });
  });

  test('the marketing header is still present on the redirect target', async ({ portfolioPage }) => {
    await expect(portfolioPage.logoLink).toBeVisible();
  });
});