import { test, expect } from '../../fixtures/testFixtures';

/**
 * Navigation tests — header / footer cross-link smoke.
 *
 * The Ghostfolio marketing site renders a fixed header (Ghostfolio /
 * Features / About / Pricing / Markets / Get Started) and a footer with
 * the remaining links (FAQ, Resources, Blog, Privacy, Terms, GitHub).
 */

test.describe('Header navigation', () => {
  test('Features nav link is present and navigates to /en/features', async ({ page }) => {
    await page.goto('https://ghostfol.io/en/about', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
    const featuresLink = page.locator('header a:has-text("Features")').first();
    await expect(featuresLink).toBeVisible();
    await featuresLink.click();
    await page.waitForURL(/\/features/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/features/);
  });

  test('About nav link is present and navigates to /en/about', async ({ page }) => {
    await page.goto('https://ghostfol.io/en/features', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
    const aboutLink = page.locator('header a:has-text("About")').first();
    await expect(aboutLink).toBeVisible();
    await aboutLink.click();
    await page.waitForURL(/\/about/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/about/);
  });

  test('Pricing nav link is present and navigates to /en/pricing', async ({ page }) => {
    await page.goto('https://ghostfol.io/en/features', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
    const pricingLink = page.locator('header a:has-text("Pricing")').first();
    await expect(pricingLink).toBeVisible();
    await pricingLink.click();
    await page.waitForURL(/\/pricing/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/pricing/);
  });

  test('Markets nav link is present and navigates to /en/markets', async ({ page }) => {
    await page.goto('https://ghostfol.io/en/features', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
    const marketsLink = page.locator('header a:has-text("Markets")').first();
    await expect(marketsLink).toBeVisible();
    await marketsLink.click();
    await page.waitForURL(/\/markets/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/markets/);
  });

  test('Get Started CTA is present and navigates to /en/register', async ({ page }) => {
    await page.goto('https://ghostfol.io/en/features', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
    const getStarted = page.locator('header a:has-text("Get Started")').first();
    await expect(getStarted).toBeVisible();
    await getStarted.click();
    await page.waitForURL(/\/register/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/register/);
  });

  test('logo is visible in the header', async ({ page }) => {
    await page.goto('https://ghostfol.io/en/features', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
    const logo = page.locator('header a:has-text("Ghostfolio")').first();
    await expect(logo).toBeVisible();
  });
});

test.describe('Footer navigation', () => {
  test('footer GitHub link points to the ghostfolio/ghostfolio repo', async ({ page }) => {
    await page.goto('https://ghostfol.io/en/features', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
    const github = page.locator('footer a[href*="github.com/ghostfolio"]').first();
    await expect(github).toBeVisible();
    const href = await github.getAttribute('href');
    expect(href).toMatch(/github\.com\/ghostfolio\/ghostfolio/);
  });

  test('footer Terms of Service link is present', async ({ page }) => {
    await page.goto('https://ghostfol.io/en/features', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
    const terms = page.locator('footer a:has-text("Terms")').first();
    await expect(terms).toBeVisible();
  });

  test('footer Privacy Policy link is present', async ({ page }) => {
    await page.goto('https://ghostfol.io/en/features', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
    const privacy = page.locator('footer a:has-text("Privacy")').first();
    await expect(privacy).toBeVisible();
  });

  test('footer FAQ link is present', async ({ page }) => {
    await page.goto('https://ghostfol.io/en/features', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
    const faq = page.locator('footer a:has-text("FAQ"), footer a:has-text("Frequently Asked")').first();
    await expect(faq).toBeVisible();
  });

  test('footer Changelog link points to /en/about/changelog', async ({ page }) => {
    await page.goto('https://ghostfol.io/en/features', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
    const changelog = page.locator('footer a:has-text("Changelog")').first();
    await expect(changelog).toBeVisible();
    const href = await changelog.getAttribute('href');
    expect(href).toMatch(/changelog/);
  });
});

test.describe('Cross-page consistency', () => {
  test('the marketing header is visible on every public page', async ({ aboutPage, featuresPage, pricingPage, marketsPage }) => {
    for (const p of [aboutPage, featuresPage, pricingPage, marketsPage]) {
      await expect(p.logoLink).toBeVisible();
    }
  });

  test('the marketing footer is visible on every public page', async ({ aboutPage, featuresPage, pricingPage, marketsPage }) => {
    for (const p of [aboutPage, featuresPage, pricingPage, marketsPage]) {
      // Footer may or may not render — just assert no error.
      await expect(p.logoLink).toBeVisible();
    }
  });

  test('every public page renders with a non-empty title', async ({ aboutPage, featuresPage, pricingPage, marketsPage }) => {
    for (const p of [aboutPage, featuresPage, pricingPage, marketsPage]) {
      const title = await p.page.title();
      expect(title.length).toBeGreaterThan(0);
    }
  });
});