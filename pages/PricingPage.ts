import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * PricingPage — public pricing page at /en/pricing.
 *
 * Renders the Premium tier card with the Stripe checkout CTA. Free
 * (self-hosted) tier is implicit — the "Get Started" link points to the
 * registration page.
 */
export class PricingPage extends BasePage {
  readonly heading: Locator;
  readonly freeTierCard: Locator;
  readonly premiumTierCard: Locator;
  readonly premiumPrice: Locator;
  readonly subscribeButton: Locator;
  readonly getStartedButton: Locator;
  readonly featureComparisonTable: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.locator('h1, h2').filter({ hasText: /pricing|subscription|tier/i }).first();
    this.freeTierCard = page.locator('mat-card:has-text("Free"), [class*="free-tier"]').first();
    this.premiumTierCard = page.locator('mat-card:has-text("Premium"), [class*="premium-tier"]').first();
    this.premiumPrice = page.locator('text=/\\$\\d+|USD\\s*\\d+|price/i').first();
    this.subscribeButton = page.locator('button:has-text("Subscribe"), button:has-text("Get Premium"), a:has-text("Subscribe")').first();
    this.getStartedButton = page.locator('a:has-text("Get Started"), button:has-text("Get Started")').first();
    this.featureComparisonTable = page.locator('table:has-text("Feature")').first();
  }

  /** Open the pricing page. */
  async open(): Promise<void> {
    await this.goto('/en/pricing');
    await this.waitForAppReady();
  }

  /** Click the Subscribe / Get Premium CTA. */
  async clickSubscribe(): Promise<void> {
    await this.subscribeButton.click();
    await this.waitForAppReady();
  }

  /** Assert the pricing page rendered (H1 visible). */
  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/pricing/);
    await expect(this.heading).toBeVisible();
  }
}