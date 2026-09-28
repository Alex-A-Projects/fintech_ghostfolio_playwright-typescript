import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * FAQPage — public FAQ at /en/faq.
 *
 * Renders an accordion of common questions (data sources, security,
 * import formats, pricing). Expand each section to verify content.
 */
export class FAQPage extends BasePage {
  readonly heading: Locator;
  readonly faqAccordion: Locator;
  readonly faqItems: Locator;
  readonly contactSupportLink: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.locator('h1, h2').filter({ hasText: /frequently|faq|questions/i }).first();
    this.faqAccordion = page.locator('mat-accordion, [class*="accordion"]').first();
    this.faqItems = page.locator('mat-expansion-panel, details, [class*="faq-item"]');
    this.contactSupportLink = page.locator('a:has-text("Contact"), a:has-text("support")').first();
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
  }

  /** Open the FAQ page. */
  async open(): Promise<void> {
    await this.goto('/en/faq');
    await this.waitForAppReady();
  }

  /** Click the first FAQ accordion item. */
  async expandFirstItem(): Promise<void> {
    const first = this.faqItems.first();
    if (await first.isVisible().catch(() => false)) {
      await first.click();
      await this.page.waitForTimeout(200);
    }
  }

  /** Number of FAQ items rendered. */
  async getFaqItemCount(): Promise<number> {
    return await this.faqItems.count();
  }

  /** Assert the FAQ page rendered (heading visible). */
  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/faq/);
    await expect(this.heading).toBeVisible();
  }
}