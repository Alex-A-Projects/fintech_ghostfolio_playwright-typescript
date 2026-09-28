import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * PortfolioPage — the post-login portfolio analytics dashboard at /en/portfolio.
 *
 * Renders:
 *   - Header KPIs: Net Worth, Performance (Day / YTD / Max), Dividends.
 *   - Holdings table with: Symbol, Name, Allocation %, Performance %.
 *   - Chart tabs: Holdings, Performance, Dividends, Summary, etc.
 *   - Filters: date range, account, symbol, asset class.
 *   - "No data" empty state when the user has no activities.
 */
export class PortfolioPage extends BasePage {
  readonly heading: Locator;

  // KPI tiles
  readonly netWorthTile: Locator;
  readonly performanceTile: Locator;
  readonly dividendTile: Locator;
  readonly fireTile: Locator;

  // Chart controls
  readonly chartTabs: Locator;
  readonly holdingsTab: Locator;
  readonly performanceTab: Locator;
  readonly dividendsTab: Locator;
  readonly summaryTab: Locator;
  readonly timelineTab: Locator;
  readonly accountsTab: Locator;
  readonly allocationTab: Locator;

  // Filter controls
  readonly dateRangeSelect: Locator;
  readonly accountFilter: Locator;
  readonly groupBySelect: Locator;

  // Holdings table
  readonly holdingsTable: Locator;
  readonly holdingsRows: Locator;
  readonly noDataMessage: Locator;

  // Action buttons
  readonly addActivityButton: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.locator('h1, h2').filter({ hasText: /portfolio/i }).first();

    this.netWorthTile = page.locator('[class*="net-worth"], gf-portfolio-summary-card:has-text("Net Worth")').first();
    this.performanceTile = page.locator('[class*="performance-card"], gf-portfolio-summary-card:has-text("Performance")').first();
    this.dividendTile = page.locator('[class*="dividend"], gf-portfolio-summary-card:has-text("Dividend")').first();
    this.fireTile = page.locator('[class*="fire"], gf-portfolio-summary-card:has-text("FIRE")').first();

    this.chartTabs = page.locator('mat-tab-group, [role="tablist"]').first();
    this.holdingsTab = page.locator('div[role="tab"]:has-text("Holdings"), a:has-text("Holdings")').first();
    this.performanceTab = page.locator('div[role="tab"]:has-text("Performance"), a:has-text("Performance")').first();
    this.dividendsTab = page.locator('div[role="tab"]:has-text("Dividends"), a:has-text("Dividends")').first();
    this.summaryTab = page.locator('div[role="tab"]:has-text("Summary"), a:has-text("Summary")').first();
    this.timelineTab = page.locator('div[role="tab"]:has-text("Timeline"), a:has-text("Timeline")').first();
    this.accountsTab = page.locator('div[role="tab"]:has-text("Accounts"), a:has-text("Accounts")').first();
    this.allocationTab = page.locator('div[role="tab"]:has-text("Allocation"), a:has-text("Allocation")').first();

    this.dateRangeSelect = page.locator('mat-select, select[name*="date"], select[name*="range"]').first();
    this.accountFilter = page.locator('mat-select:has-text("Account"), select[name*="account"]').first();
    this.groupBySelect = page.locator('mat-select:has-text("Group"), select[name*="group"]').first();

    this.holdingsTable = page.locator('table, [role="grid"]').first();
    this.holdingsRows = page.locator('table tbody tr, [role="row"]').first();
    this.noDataMessage = page.locator('text=/no activities|no data|no holdings|empty/i').first();

    this.addActivityButton = page.locator('a:has-text("Add activity"), button:has-text("Add activity")').first();
  }

  /** Open the portfolio page. */
  async open(): Promise<void> {
    await this.goto('/en/portfolio');
    await this.waitForAppReady();
  }

  /** Click the Holdings tab. */
  async clickHoldings(): Promise<void> {
    await this.holdingsTab.click();
    await this.page.waitForTimeout(300);
  }

  /** Click the Performance tab. */
  async clickPerformance(): Promise<void> {
    await this.performanceTab.click();
    await this.page.waitForTimeout(300);
  }

  /** Click the Dividends tab. */
  async clickDividends(): Promise<void> {
    await this.dividendsTab.click();
    await this.page.waitForTimeout(300);
  }

  /** Assert the portfolio page loaded (a KPI tile or tab is visible). */
  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/portfolio/);
    await expect(this.chartTabs).toBeVisible();
  }
}