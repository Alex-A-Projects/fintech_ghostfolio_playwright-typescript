import { test, expect } from '../../fixtures/testFixtures';

/**
 * Pricing page tests — covers /en/pricing (Premium tier + Stripe CTA).
 */

test.describe('Pricing page', () => {
  test('page loads with the heading visible', async ({ pricingPage }) => {
    await pricingPage.assertLoaded();
  });

  test('the Get Started CTA is visible', async ({ pricingPage }) => {
    await expect(pricingPage.getStartedButton).toBeVisible();
  });

  test('page has a non-empty <title>', async ({ pricingPage }) => {
    const title = await pricingPage.page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title).toMatch(/Pricing/);
  });

  test('clicking Get Started from /en/pricing navigates to /en/register', async ({ pricingPage, page }) => {
    await pricingPage.getStartedButton.click();
    await pricingPage.waitForAppReady();
    await expect(page).toHaveURL(/\/(en\/)?register/);
  });

  test('pricing page has a Premium / subscription tier mentioned somewhere', async ({ page }) => {
    // The public Ghostfolio pricing page renders three tiers: Open
    // Source, Basic, Premium. The Premium tier text mentions
    // "Premium", "per year", "USD 48", etc. Navigate fresh and wait
    // for the SPA to render.
    await page.goto('https://ghostfol.io/en/pricing', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
    const bodyText = await page.locator('body').textContent();
    expect(bodyText ?? '').toMatch(/premium|per year|USD\s*\d+|subscription|monthly|yearly/i);
  });
});