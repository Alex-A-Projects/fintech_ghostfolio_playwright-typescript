import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ZenPage — the "Zen" mode at /en/zen.
 *
 * A read-only mode that hides all monetary values (used for sharing
 * screenshots without revealing balances). The page shows portfolio
 * structure but no $ amounts.
 */
export class ZenPage extends BasePage {
  readonly heading: Locator;
  readonly holdingsList: Locator;
  readonly toggleZenButton: Locator;
  readonly demoLink: Locator;
  readonly aboutZenSection: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.locator('h1, h2').filter({ hasText: /zen/i }).first();
    this.holdingsList = page.locator('mat-list, ul, table').first();
    this.toggleZenButton = page.locator('button:has-text("Zen"), a:has-text("Zen")').first();
    this.demoLink = page.locator('a[href*="/demo"]').first();
    this.aboutZenSection = page.locator('section:has-text("Zen"), [class*="zen"]').first();
  }

  /** Open the Zen mode. */
  async open(): Promise<void> {
    await this.goto('/en/zen');
    await this.waitForAppReady();
  }

  /** Assert the Zen page loaded (or redirected). */
  async assertLoaded(): Promise<void> {
    // /en/zen may redirect to /en/start on the public demo.
    await expect(this.page).toHaveURL(/\/(zen|start|home)/);
    await expect(this.heading).toBeVisible();
  }
}