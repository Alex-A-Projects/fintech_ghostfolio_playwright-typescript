import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * LandingPage — the public marketing entry points.
 *
 * Ghostfolio has two public "landing" surfaces:
 *   - /en           → corporate homepage (Features, Markets, FAQ…)
 *   - /en/start     → "Manage your wealth like a boss" landing with the
 *                     Get Started CTA and a Live Demo link / banner.
 *
 * Both share the same global header / footer. The Live Demo destination
 * is /en/demo, which renders the demo user's portfolio overview.
 */
export class LandingPage extends BasePage {
  // Headline CTA pair shown on /en/start
  readonly heroHeading: Locator;
  readonly heroSubheading: Locator;
  readonly getStartedHeroButton: Locator;
  readonly liveDemoHeroButton: Locator;
  readonly liveDemoBannerLink: Locator;

  // Homepage (/en) sections
  readonly featureSectionHeading: Locator;
  readonly performanceSectionHeading: Locator;
  readonly securitySectionHeading: Locator;
  readonly pricingTeaser: Locator;

  // Hero CTA section on /en/start
  readonly heroVideo: Locator;
  readonly heroPlayButton: Locator;

  constructor(page: Page) {
    super(page);

    this.heroHeading = page.locator('h1:has-text("Manage your wealth"), h1:has-text("Wealth Management")').first();
    this.heroSubheading = page.locator('p:has-text("privacy-first"), p:has-text("open source")').first();
    this.getStartedHeroButton = page.locator('a:has-text("Get Started"), a:has-text("Get started"), button:has-text("Get Started")').first();
    // Live Demo may be either a CTA button or a banner link inside the header info bar.
    this.liveDemoHeroButton = page.locator('a:has-text("Live Demo"), button:has-text("Live Demo")').first();
    this.liveDemoBannerLink = page.locator('header a:has-text("Live Demo"), a:has-text("Live Demo")').first();

    this.featureSectionHeading = page.locator('h2:has-text("Features"), h2:has-text("Track everything"), h2:has-text("Why Ghostfolio")').first();
    this.performanceSectionHeading = page.locator('h2:has-text("Performance"), h2:has-text("Analyze")').first();
    this.securitySectionHeading = page.locator('h2:has-text("Privacy"), h2:has-text("Secure"), h2:has-text("Security"), h2:has-text("Protect")').first();
    this.pricingTeaser = page.locator('section:has-text("Pricing"), [id*="pricing"] a').first();

    this.heroVideo = page.locator('video, iframe[src*="youtube"], iframe[src*="vimeo"]').first();
    this.heroPlayButton = page.locator('button[aria-label*="Play"], button[aria-label*="play"]').first();
  }

  /** Open the corporate homepage. */
  async openHome(): Promise<void> {
    await this.goto('/en');
    await this.waitForAppReady();
  }

  /** Open the "Manage your wealth" landing page (where the Live Demo CTA lives). */
  async openStart(): Promise<void> {
    await this.goto('/en/start');
    await this.waitForAppReady();
  }

  /**
   * Click the Live Demo CTA / banner link and wait for navigation to
   * /en/demo. The exact selector depends on which Live Demo surface
   * the page currently exposes (CTA button vs. header banner link).
   */
  async clickLiveDemo(): Promise<void> {
    const target = (await this.liveDemoHeroButton.isVisible({ timeout: 2_000 }).catch(() => false))
      ? this.liveDemoHeroButton
      : this.liveDemoBannerLink;
    await Promise.all([
      this.page.waitForURL(/\/(en\/)?(demo|home)/, { timeout: 30_000 }),
      target.first().click(),
    ]);
    await this.waitForAppReady();
  }

  /** Click the Get Started CTA. */
  async clickGetStarted(): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/\/(en\/)?(register|home)/, { timeout: 30_000 }).catch(() => undefined),
      this.getStartedHeroButton.click(),
    ]);
    await this.waitForAppReady();
  }

  /** Verify the start page loaded with hero CTA pair visible. */
  async assertStartLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/en\/start$/);
    await expect(this.heroHeading).toBeVisible();
    await expect(this.getStartedHeroButton).toBeVisible();
  }

  /** Verify the homepage loaded with the hero CTA pair. */
  async assertHomeLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/en$/);
    await expect(this.page.locator('h1').first()).toBeVisible();
  }
}