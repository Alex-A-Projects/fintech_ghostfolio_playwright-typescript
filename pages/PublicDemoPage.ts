import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * PublicDemoPage — the read-only live demo at /en/demo.
 *
 * Reachable via the "Live Demo" CTA on the /en/start landing page. Renders
 * the Ghostfolio dashboard with a demo user's portfolio. The page also
 * shows a banner ("You are using the Live Demo. Create Account...") that
 * links back to /en/register.
 */
export class PublicDemoPage extends BasePage {
  readonly heading: Locator;
  readonly demoBadge: Locator;
  readonly demoBanner: Locator;
  readonly netWorthTile: Locator;
  readonly performanceTile: Locator;
  readonly dividendTile: Locator;
  readonly holdingsTable: Locator;
  readonly holdingsRows: Locator;
  readonly signUpCTA: Locator;
  readonly signInCTA: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.locator('h1, h2').first();
    this.demoBadge = page.locator('text=/demo|sample/i').first();
    // The demo banner is the most reliable signal that /en/demo rendered.
    this.demoBanner = page.locator('text=/You are using the Live Demo/i').first();
    this.netWorthTile = page.locator('[class*="net-worth"], gf-portfolio-summary-card').first();
    this.performanceTile = page.locator('[class*="performance"]').first();
    this.dividendTile = page.locator('[class*="dividend"]').first();
    this.holdingsTable = page.locator('table, [role="grid"]').first();
    this.holdingsRows = page.locator('table tbody tr, [role="row"]');
    this.signUpCTA = page.locator('a:has-text("Sign up"), a:has-text("Create Account"), button:has-text("Sign up")').first();
    this.signInCTA = page.locator('a:has-text("Sign in"), button:has-text("Sign in")').first();
  }

  /** Open the public demo dashboard. */
  async open(): Promise<void> {
    await this.goto('/en/demo');
    await this.waitForAppReady();
  }

  /** Assert the public demo loaded — /en/demo redirects to /en/home and the demo banner is visible. */
  async assertLoaded(): Promise<void> {
    // The /en/demo route redirects to /en/home in demo mode.
    await expect(this.page).toHaveURL(/\/(en\/)?(demo|home)/);
    // The banner is the canonical signal that we're in demo mode.
    await expect(this.demoBanner).toBeVisible({ timeout: 10_000 });
  }

  /** Number of holdings rows in the demo's table. */
  async getHoldingsRowCount(): Promise<number> {
    return await this.holdingsRows.count();
  }
}