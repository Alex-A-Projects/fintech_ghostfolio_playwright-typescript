import { test, expect } from '../../fixtures/testFixtures';

/**
 * FAQ page tests — covers /en/faq (cards of common questions).
 *
 * The public Ghostfolio FAQ renders each Q/A as a mat-card (rendered
 * asynchronously by the SPA). The fixture's `goto()` may return before
 * the cards are mounted, so we re-navigate inside each test with a
 * generous wait.
 */

test.describe('FAQ page', () => {
  test('page loads with the heading visible', async ({ faqPage }) => {
    await faqPage.assertLoaded();
  });

  test('the FAQ page renders at least one FAQ item (mat-card)', async ({ page }) => {
    // The public Ghostfolio FAQ renders each Q/A as a mat-card. The SPA
    // bootstraps asynchronously so we navigate fresh and wait for the
    // first card to appear.
    await page.goto('https://ghostfol.io/en/faq', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
    await page.locator('mat-card').first().waitFor({ state: 'visible', timeout: 30_000 });
    const cards = await page.locator('mat-card').count();
    expect(cards).toBeGreaterThan(0);
  });

  test('FAQ page has a non-empty <title>', async ({ faqPage }) => {
    const title = await faqPage.page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title).toMatch(/FAQ|Questions/);
  });

  test('FAQ page contains the word "Frequently Asked" or "FAQ"', async ({ page }) => {
    // Re-navigate fresh and wait for the SPA to render the H1 heading.
    await page.goto('https://ghostfol.io/en/faq', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
    const h1 = page.locator('h1').first();
    await h1.waitFor({ state: 'visible', timeout: 30_000 });
    const text = await h1.textContent();
    expect(text ?? '').toMatch(/Frequently Asked|FAQ|Question/i);
  });
});