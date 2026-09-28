import { test, expect } from '../../fixtures/testFixtures';

/**
 * Public demo page tests — covers /en/demo (the Live Demo destination).
 *
 * The demo is the read-only sample portfolio accessible without logging
 * in. It's the destination of the Live Demo CTA on /en/start and is the
 * primary smoke target for the entire UI flow.
 */

test.describe('Public Demo page (/en/demo)', () => {
  test('page loads with the Live Demo banner visible', async ({ publicDemoPage }) => {
    // /en/demo redirects to /en/home with a "Live Demo" banner.
    await expect(publicDemoPage.demoBanner).toBeVisible({ timeout: 10_000 });
  });

  test('the demo exposes a Create Account CTA inside the banner', async ({ publicDemoPage }) => {
    // The banner says "You are using the Live Demo. Create Account" — the
    // "Create Account" link is the Sign Up CTA for this surface.
    const bannerLink = publicDemoPage.page.locator('header a:has-text("Create Account")').first();
    await expect(bannerLink).toBeVisible();
  });

  test('the demo page has a non-empty <title>', async ({ publicDemoPage }) => {
    const title = await publicDemoPage.page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toMatch(/^404/);
  });

  test('the demo page does not redirect to /login', async ({ publicDemoPage }) => {
    await expect(publicDemoPage.page).not.toHaveURL(/\/login/);
  });

  test('the demo page renders the Overview nav (authed dashboard)', async ({ publicDemoPage }) => {
    const overview = publicDemoPage.page.locator('header a:has-text("Overview")').first();
    await expect(overview).toBeVisible();
  });

  test('the demo page renders a Portfolio tab in the header', async ({ publicDemoPage }) => {
    const portfolio = publicDemoPage.page.locator('header a:has-text("Portfolio")').first();
    await expect(portfolio).toBeVisible();
  });

  test('the demo page renders an Accounts tab in the header', async ({ publicDemoPage }) => {
    const accounts = publicDemoPage.page.locator('header a:has-text("Accounts")').first();
    await expect(accounts).toBeVisible();
  });

  test('clicking Create Account from the demo goes to /en/register', async ({ page, publicDemoPage }) => {
    const bannerLink = page.locator('header a:has-text("Create Account")').first();
    if (await bannerLink.isVisible().catch(() => false)) {
      await Promise.all([
        page.waitForURL(/\/(en\/)?register/, { timeout: 15_000 }).catch(() => undefined),
        bannerLink.click(),
      ]);
      await publicDemoPage.waitForAppReady();
      await expect(page).toHaveURL(/\/(en\/)?register/);
    }
  });
});