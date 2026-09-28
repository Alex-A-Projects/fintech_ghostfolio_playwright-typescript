import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * FeaturesPage — public marketing feature list at /en/features.
 *
 * Renders the feature grid (multi-currency, asset classes, performance
 * analysis, etc.) and the demo CTA. Public access is allowed without
 * authentication.
 */
export class FeaturesPage extends BasePage {
  readonly heading: Locator;
  readonly featureCards: Locator;
  readonly liveDemoButton: Locator;
  readonly getStartedButton: Locator;
  readonly categoriesHeading: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.locator('h1, h2').filter({ hasText: /feature|capabilit/i }).first();
    this.featureCards = page.locator('mat-card, [class*="feature-card"], section h3');
    this.liveDemoButton = page.locator('a:has-text("Live Demo"), button:has-text("Live Demo")').first();
    this.getStartedButton = page.locator('a:has-text("Get started"), button:has-text("Get Started")').first();
    this.categoriesHeading = page.locator('h2:has-text("Categories"), h3:has-text("Categories")').first();
  }

  /** Open the Features page. */
  async open(): Promise<void> {
    await this.goto('/en/features');
    await this.waitForAppReady();
  }

  /** Assert the Features page rendered. */
  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/features/);
    await expect(this.heading).toBeVisible();
  }

  /** Number of feature cards visible. */
  async getFeatureCardCount(): Promise<number> {
    // Count either h3 (feature title), mat-card (Material card), or any
    // element with "feature" in its class — they're all valid feature
    // surfaces on this page.
    const h3 = await this.page.locator('h3').count();
    if (h3 > 0) return h3;
    return await this.featureCards.count();
  }
}