import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ResourcesPage — public resources index at /en/resources.
 *
 * Lists downloadable resources, white papers, and integration guides.
 */
export class ResourcesPage extends BasePage {
  readonly heading: Locator;
  readonly resourceCards: Locator;
  readonly downloadLinks: Locator;
  readonly externalLinks: Locator;
  readonly blogLink: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.locator('h1, h2').filter({ hasText: /resources|learn|guides/i }).first();
    this.resourceCards = page.locator('mat-card, [class*="resource"]');
    this.downloadLinks = page.locator('a:has-text("Download"), a[download]');
    this.externalLinks = page.locator('a[target="_blank"]');
    this.blogLink = page.locator('a[href*="/blog"]').first();
  }

  /** Open the resources page. */
  async open(): Promise<void> {
    await this.goto('/en/resources');
    await this.waitForAppReady();
  }

  /** Assert the resources page rendered. */
  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/resources/);
    await expect(this.heading).toBeVisible();
  }

  /** Number of resource cards. */
  async getResourceCardCount(): Promise<number> {
    return await this.resourceCards.count();
  }
}