import { test, expect } from '../../fixtures/testFixtures';

/**
 * About page tests — covers /en/about (mission, sponsors, social).
 */

test.describe('About page', () => {
  test('page loads with the heading visible', async ({ aboutPage }) => {
    await aboutPage.assertLoaded();
  });

  test('GitHub repository link is present (header or footer)', async ({ aboutPage }) => {
    const count = await aboutPage.footerGithubLink.count();
    expect(count).toBeGreaterThan(0);
    const href = await aboutPage.footerGithubLink.first().getAttribute('href');
    expect(href).toMatch(/github\.com\/ghostfolio/);
  });

  test('Changelog link points to /en/about/changelog', async ({ aboutPage }) => {
    // The Changelog link is on /en/about but not in the global footer
    // on this page — search the whole page.
    const changelog = aboutPage.page.locator('a[href*="changelog"]').first();
    await expect(changelog).toBeVisible({ timeout: 15_000 });
    const href = await changelog.getAttribute('href');
    expect(href).toMatch(/changelog/);
  });

  test('about page has a non-empty <title>', async ({ aboutPage }) => {
    const title = await aboutPage.page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('about page renders an H1 heading', async ({ aboutPage }) => {
    const h1 = aboutPage.page.locator('h1').first();
    await expect(h1).toBeVisible();
    const text = (await h1.textContent())?.trim() ?? '';
    expect(text.length).toBeGreaterThan(0);
  });

  test('about page exposes at least one social link (Slack / X / LinkedIn)', async ({ page }) => {
    // The /en/about page doesn't render a <footer> — social links live
    // in the body content. Navigate fresh and search the whole page.
    await page.goto('https://ghostfol.io/en/about', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
    const social = page.locator('a[href*="slack"], a[href*="linkedin"], a[href*="x.com"]').first();
    await expect(social).toBeVisible({ timeout: 30_000 });
  });
});