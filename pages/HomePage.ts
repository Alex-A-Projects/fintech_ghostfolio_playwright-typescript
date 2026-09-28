import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * HomePage — the post-login internal landing at /en/home.
 *
 * After successful login Ghostfolio redirects to /home which renders the
 * authenticated home view (greeting, CTA tiles, latest activities summary).
 * The home view also exposes the primary nav: Home, Portfolio, Accounts,
 * Admin (admin only), Markets.
 */
export class HomePage extends BasePage {
  // Top tab nav
  readonly homeTab: Locator;
  readonly portfolioTab: Locator;
  readonly accountsTab: Locator;
  readonly adminTab: Locator;
  readonly marketsTab: Locator;
  readonly zenTab: Locator;
  readonly faqTab: Locator;
  readonly aboutTab: Locator;

  // Hero greeting
  readonly greetingHeading: Locator;
  readonly greetingMessage: Locator;
  readonly userAvatar: Locator;

  // Account summary card
  readonly totalValueCard: Locator;
  readonly performanceCard: Locator;
  readonly dividendCard: Locator;

  // Quick actions
  readonly addActivityButton: Locator;
  readonly addAccountButton: Locator;
  readonly importDataButton: Locator;

  // System message / banner
  readonly systemMessage: Locator;

  constructor(page: Page) {
    super(page);

    this.homeTab = page.locator('a[href*="/home"], nav a:has-text("Home")').first();
    this.portfolioTab = page.locator('a[href*="/portfolio"], nav a:has-text("Portfolio")').first();
    this.accountsTab = page.locator('a[href*="/accounts"], nav a:has-text("Accounts")').first();
    this.adminTab = page.locator('a[href*="/admin"], nav a:has-text("Admin")').first();
    this.marketsTab = page.locator('a[href*="/markets"], nav a:has-text("Markets")').first();
    this.zenTab = page.locator('a[href*="/zen"], nav a:has-text("Zen")').first();
    this.faqTab = page.locator('a[href*="/faq"], nav a:has-text("FAQ")').first();
    this.aboutTab = page.locator('a[href*="/about"], nav a:has-text("About")').first();

    this.greetingHeading = page.locator('h1, h2').filter({ hasText: /hi|hello|welcome|hey/i }).first();
    this.greetingMessage = page.locator('text=/ghostfol.io|enjoy|portfolio/i').first();
    this.userAvatar = page.locator('img[alt*="avatar"], img[alt*="Avatar"], .user-avatar').first();

    this.totalValueCard = page.locator('[class*="total"], [data-test*="total"]').first();
    this.performanceCard = page.locator('[class*="performance"]').first();
    this.dividendCard = page.locator('[class*="dividend"]').first();

    this.addActivityButton = page.locator('a:has-text("Add activity"), button:has-text("Add activity")').first();
    this.addAccountButton = page.locator('a:has-text("Add account"), button:has-text("Add account")').first();
    this.importDataButton = page.locator('a:has-text("Import"), button:has-text("Import")').first();

    this.systemMessage = page.locator('[class*="system-message"], mat-card:has-text("System")').first();
  }

  /** Open the post-login home view. */
  async open(): Promise<void> {
    await this.goto('/en/home');
    await this.waitForAppReady();
  }

  /** Click the Portfolio tab and wait for navigation. */
  async goToPortfolio(): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/\/portfolio/, { timeout: 15_000 }).catch(() => undefined),
      this.portfolioTab.click(),
    ]);
    await this.waitForAppReady();
  }

  /** Click the Accounts tab. */
  async goToAccounts(): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/\/accounts/, { timeout: 15_000 }).catch(() => undefined),
      this.accountsTab.click(),
    ]);
    await this.waitForAppReady();
  }

  /** Assert the home view loaded (greeting or hero card visible). */
  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/home$/);
    // The home view should render one of: greeting, hero card, or tab nav.
    await expect(this.portfolioTab).toBeVisible();
  }
}