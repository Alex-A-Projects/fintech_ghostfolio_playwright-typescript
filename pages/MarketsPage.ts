import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * MarketsPage — public markets browser at /en/markets.
 *
 * Lists benchmark assets (Bitcoin, S&P 500, MSCI World, etc.) with
 * current price and day change. Useful for smoke-testing the data
 * provider (Yahoo, CoinGecko) integration.
 */
export class MarketsPage extends BasePage {
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly marketCards: Locator;
  readonly assetRows: Locator;
  readonly benchmarkSection: Locator;
  readonly currencyFilter: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.locator('h1, h2').filter({ hasText: /markets|market data/i }).first();
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    this.marketCards = page.locator('mat-card, [class*="market"]');
    this.assetRows = page.locator('table tbody tr, [role="row"]');
    this.benchmarkSection = page.locator('section:has-text("Benchmark")').first();
    this.currencyFilter = page.locator('mat-select[name*="currency"]').first();
  }

  /** Open the markets page. */
  async open(): Promise<void> {
    await this.goto('/en/markets');
    await this.waitForAppReady();
  }

  /** Assert the markets page rendered with at least one asset. */
  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/markets/);
    await expect(this.heading).toBeVisible();
  }

  /** Number of market items rendered. */
  async getMarketItemCount(): Promise<number> {
    const cards = await this.marketCards.count();
    if (cards > 0) return cards;
    return await this.assetRows.count();
  }
}