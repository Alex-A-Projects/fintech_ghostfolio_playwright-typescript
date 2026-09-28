import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * AboutPage — the public "About" page at /en/about.
 *
 * Renders Ghostfolio's mission statement, the team / community section,
 * and links to the changelog, GitHub repo and contact email.
 */
export class AboutPage extends BasePage {
  readonly heading: Locator;
  readonly missionSection: Locator;
  readonly teamSection: Locator;
  readonly changelogLink: Locator;
  readonly githubLink: Locator;
  readonly twitterLink: Locator;
  readonly contactLink: Locator;
  readonly subscribeSection: Locator;
  readonly emailInput: Locator;
  readonly subscribeButton: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.locator('h1, h2').filter({ hasText: /about|mission/i }).first();
    this.missionSection = page.locator('section:has-text("mission"), section:has-text("Mission"), [class*="mission"]').first();
    this.teamSection = page.locator('section:has-text("team"), section:has-text("Team"), [class*="team"]').first();
    this.changelogLink = page.locator('a[href*="changelog"], a:has-text("Changelog")').first();
    this.githubLink = page.locator('a[href*="github.com/ghostfolio"]').first();
    this.twitterLink = page.locator('a[href*="twitter"], a[href*="x.com"]').first();
    this.contactLink = page.locator('a[href*="mailto:"], a:has-text("Contact")').first();
    this.subscribeSection = page.locator('section:has-text("Subscribe"), [class*="subscribe"]').first();
    this.emailInput = page.locator('input[type="email"], input[name="email"]').first();
    this.subscribeButton = page.locator('button:has-text("Subscribe")').first();
  }

  /** Open the About page. */
  async open(): Promise<void> {
    await this.goto('/en/about');
    await this.waitForAppReady();
  }

  /** Assert the About page loaded with heading + mission section visible. */
  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/about/);
    await expect(this.heading).toBeVisible();
  }
}