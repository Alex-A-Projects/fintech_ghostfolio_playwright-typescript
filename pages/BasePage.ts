import { Page, Locator } from '@playwright/test';

/**
 * BasePage - shared behaviour for every Page Object.
 *
 * Provides:
 *  - Navigation helpers (open, goto) with retry/backoff for transient
 *    502/503/504 responses from the Angular SPA bootstrap.
 *  - Ghostfolio global header locators (logo, nav links, language menu,
 *    sign-in / register buttons, theme toggle) which exist on most pages.
 *  - The footer link locators common to every public marketing page.
 *  - Common helpers for toasts, error toasts, loading skeletons.
 *
 * The /en/<path> structure is the canonical URL. The base URL is
 * https://ghostfol.io (production).
 */
export class BasePage {
  /** Canonical Ghostfolio base URL used by every Page Object. */
  static readonly BASE_URL = 'https://ghostfol.io';

  readonly page: Page;

  /**
   * The base URL every POM uses for navigation. Defaults to the public
   * Ghostfolio demo, but tests can override it for the lifetime of a page
   * by calling `setBaseUrl(...)` — useful when a spec runs against the
   * local Docker instance instead of the cloud demo.
   */
  private baseUrl: string = BasePage.BASE_URL;

  // -------- Global header --------
  readonly logoLink: Locator;
  readonly homeNavLink: Locator;
  readonly marketsNavLink: Locator;
  readonly zenNavLink: Locator;
  readonly blogNavLink: Locator;
  readonly faqNavLink: Locator;
  readonly aboutNavLink: Locator;
  readonly featuresNavLink: Locator;
  readonly pricingNavLink: Locator;
  readonly resourcesNavLink: Locator;

  // Account / auth controls (header right side)
  readonly signInLink: Locator;
  readonly getStartedButton: Locator;
  readonly liveDemoButton: Locator;
  readonly userMenu: Locator;
  readonly languageMenuButton: Locator;

  // -------- Global footer --------
  readonly footerMarketsLink: Locator;
  readonly footerResourcesLink: Locator;
  readonly footerBlogLink: Locator;
  readonly footerFAQLink: Locator;
  readonly footerAboutLink: Locator;
  readonly footerFeaturesLink: Locator;
  readonly footerPricingLink: Locator;
  readonly footerTermsLink: Locator;
  readonly footerPrivacyLink: Locator;
  readonly footerImprintLink: Locator;
  readonly footerGithubLink: Locator;

  // -------- Generic UI --------
  readonly toast: Locator;
  readonly errorToast: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;

    // Top nav — the marketing site renders text-based nav anchors inside
    // the <gf-header> component. Match by visible text only.
    this.logoLink = page.locator('header a[href="/en/"]:has-text("Ghostfolio"), a.gf-logo, a[aria-label="Ghostfolio"]').first();
    this.homeNavLink = page.locator('header a:has-text("Overview"), header a:has-text("Home")').first();
    this.marketsNavLink = page.locator('header a:has-text("Markets")').first();
    this.zenNavLink = page.locator('header a:has-text("Zen")').first();
    this.blogNavLink = page.locator('header a:has-text("Blog")').first();
    this.faqNavLink = page.locator('header a:has-text("FAQ")').first();
    this.aboutNavLink = page.locator('header a:has-text("About")').first();
    this.featuresNavLink = page.locator('header a:has-text("Features")').first();
    this.pricingNavLink = page.locator('header a:has-text("Pricing")').first();
    this.resourcesNavLink = page.locator('header a:has-text("Resources")').first();

    // Header right-side controls
    this.signInLink = page.locator('header a:has-text("Sign in"), header a:has-text("Sign In")').first();
    this.getStartedButton = page.locator('header a:has-text("Get started"), header a:has-text("Get Started")').first();
    this.liveDemoButton = page.locator('header a:has-text("Live Demo"), header button:has-text("Live Demo")').first();
    this.userMenu = page.locator('header [aria-label="user menu"], header button[aria-haspopup="menu"]').first();
    this.languageMenuButton = page.locator('header button[aria-label="Change language"], header [aria-label="language"]').first();

    // Footer
    this.footerMarketsLink = page.locator('footer a:has-text("Markets")').first();
    this.footerResourcesLink = page.locator('footer a:has-text("Resources")').first();
    this.footerBlogLink = page.locator('footer a:has-text("Blog")').first();
    this.footerFAQLink = page.locator('footer a:has-text("FAQ"), footer a:has-text("Frequently Asked")').first();
    this.footerAboutLink = page.locator('footer a:has-text("About")').first();
    this.footerFeaturesLink = page.locator('footer a:has-text("Features")').first();
    this.footerPricingLink = page.locator('footer a:has-text("Pricing")').first();
    this.footerTermsLink = page.locator('footer a:has-text("Terms")').first();
    this.footerPrivacyLink = page.locator('footer a:has-text("Privacy")').first();
    this.footerImprintLink = page.locator('footer a:has-text("Imprint")').first();
    this.footerGithubLink = page.locator('footer a[href*="github.com/ghostfolio"], header a[href*="github.com/ghostfolio"]').first();

    // Generic toast / loading
    this.toast = page.locator('mat-snack-bar-container, [role="status"]').first();
    this.errorToast = page.locator('mat-snack-bar-container.mat-mdc-snack-bar-container-error, [role="alert"]').first();
    this.loadingSpinner = page.locator('mat-progress-spinner, [role="progressbar"]').first();
  }

  /** Override the base URL for this instance. Affects all `goto()` calls on this POM. */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  /** Maximum number of retries for transient 5xx responses on the SPA bootstrap. */
  static readonly MAX_NAV_RETRIES = 3;
  /** Initial wait between nav retries. Doubled each attempt. */
  static readonly NAV_RETRY_DELAY_MS = 5_000;

  /**
   * Returns true when the page is showing a Cloudflare-style error page
   * (502 / 504 / "Service Temporarily Unavailable"). Tests use this to
   * self-skip rather than fail noisily.
   */
  async isServiceUnavailable(): Promise<boolean> {
    return await this.page
      .locator('text=/Service Temporarily Unavailable|502 Bad Gateway|504 Gateway/i')
      .first()
      .isVisible({ timeout: 500 })
      .catch(() => false);
  }

  /**
   * Navigate to the supplied path (resolved against the base URL with /en/).
   *
   * Retries on 5xx responses with exponential backoff. If the host
   * never recovers, leaves the error page in place — tests can detect
   * it via `isServiceUnavailable()` and self-skip.
   */
  async goto(path = ''): Promise<void> {
    const cleaned = path.startsWith('/') ? path.slice(1) : path;
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : this.baseUrl + '/';
    const absolute = new URL(cleaned, base).toString();

    for (let attempt = 0; attempt < BasePage.MAX_NAV_RETRIES; attempt++) {
      try {
        await this.page.goto(absolute, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      } catch {
        // goto failure - fall through to the retry check below
      }
      if (!(await this.isServiceUnavailable())) return;
      const backoff = BasePage.NAV_RETRY_DELAY_MS * Math.pow(2, attempt);
      console.warn(
        `[BasePage] Host unavailable on attempt ${attempt + 1}/${BasePage.MAX_NAV_RETRIES}; backing off ${backoff / 1000}s`,
      );
      await this.page.waitForTimeout(backoff);
    }
  }

  /** Wait for the SPA to finish bootstrapping (loading spinner gone). */
  async waitForAppReady(): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
  }

  /** Get the current page title (the <title> tag). */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  /** Get the visible page heading — first h1 on the page. */
  async getPageHeading(): Promise<string> {
    const heading = this.page.locator('h1').first();
    await heading.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => undefined);
    return ((await heading.textContent()) ?? '').trim();
  }

  /** Returns true when the page contains a visible toast/snackbar. */
  async hasToast(): Promise<boolean> {
    return await this.toast.isVisible({ timeout: 1_000 }).catch(() => false);
  }

  /** Returns the visible toast text (empty string if none). */
  async getToastText(): Promise<string> {
    if (!(await this.hasToast())) return '';
    return ((await this.toast.textContent()) ?? '').trim();
  }
}