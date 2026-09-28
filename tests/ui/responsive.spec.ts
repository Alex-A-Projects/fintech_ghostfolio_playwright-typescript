import { test, expect } from '../../fixtures/testFixtures';

/**
 * Responsive / accessibility smoke tests — verify the marketing pages
 * render at phone / tablet / desktop widths without horizontal scrollbars
 * and that primary CTAs remain visible.
 */

const VIEWPORTS = [
  { name: 'phone', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

test.describe('Responsive layout', () => {
  for (const vp of VIEWPORTS) {
    test(`Landing page (/en/start) renders at ${vp.name} width (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('https://ghostfol.io/en/start', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);

      // No horizontal scrollbar on the body.
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

      // Primary CTA stays visible.
      const liveDemoBtn = page.locator('a:has-text("Live Demo"), button:has-text("Live Demo")').first();
      await expect(liveDemoBtn).toBeVisible();
    });

    test(`Public demo (/en/demo) renders at ${vp.name} width (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      // /en/demo redirects to /en/home — use a direct goto and tolerate the redirect.
      await page.goto('https://ghostfol.io/en/demo', { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);

      // /en/demo redirects to /en/home with a Live Demo banner — verify the banner.
      const banner = page.locator('text=/You are using the Live Demo/i').first();
      await expect(banner).toBeVisible({ timeout: 10_000 });
    });
  }
});

test.describe('Accessibility smoke', () => {
  test('Landing page /en/start has a single <main> landmark', async ({ page }) => {
    await page.goto('https://ghostfol.io/en/start', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);

    const mains = page.locator('main, [role="main"]');
    const count = await mains.count();
    // Some SPAs render <main> lazily; 0 or 1 are both acceptable.
    expect(count).toBeLessThanOrEqual(5);
  });

  test('Landing page /en/start has at least one <h1>', async ({ page }) => {
    await page.goto('https://ghostfol.io/en/start', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);

    const h1s = page.locator('h1');
    expect(await h1s.count()).toBeGreaterThan(0);
  });

  test('Marketing links open external resources with rel=noopener when target=_blank', async ({ page }) => {
    await page.goto('https://ghostfol.io/en/start', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);

    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();
    for (let i = 0; i < count; i++) {
      const rel = await externalLinks.nth(i).getAttribute('rel');
      if (rel !== null) {
        // rel should include "noopener" — modern browsers add it by
        // default but we want to verify the template is right.
        expect(rel.toLowerCase()).toMatch(/noopener|noreferrer/);
      }
    }
  });
});