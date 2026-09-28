import { test, expect } from '../../fixtures/testFixtures';

/**
 * Features page tests — covers /en/features (capability grid + CTA).
 */

test.describe('Features page', () => {
  test('page loads with the heading visible', async ({ featuresPage }) => {
    await featuresPage.assertLoaded();
  });

  test('the Get Started CTA is present on /en/features', async ({ featuresPage }) => {
    await expect(featuresPage.getStartedButton).toBeVisible();
  });

  test('clicking the Get Started CTA from /en/features navigates to /en/register', async ({ featuresPage, page }) => {
    await featuresPage.getStartedButton.click();
    await featuresPage.waitForAppReady();
    await expect(page).toHaveURL(/\/(en\/)?register/);
  });

  test('features page contains an Open Startup CTA', async ({ featuresPage, page }) => {
    const openStartup = page.locator('a:has-text("Open Startup")').first();
    await expect(openStartup).toBeVisible();
  });

  test('features page renders at least one feature card', async ({ featuresPage }) => {
    const count = await featuresPage.getFeatureCardCount();
    expect(count).toBeGreaterThan(0);
  });
});