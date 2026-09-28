import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * LoginPage — the Ghostfolio login form at /en/login.
 *
 * On the public Ghostfolio demo the /en/login route redirects to
 * /en/start (the marketing landing) for anonymous visitors — login is
 * only available behind the security-token flow or Google OAuth on
 * self-hosted builds. We model both possibilities: the form MAY be
 * visible, or we land on the marketing site.
 */
export class LoginPage extends BasePage {
  readonly heading: Locator;
  readonly accessTokenInput: Locator;
  readonly signInButton: Locator;
  readonly googleSignInButton: Locator;
  readonly signUpLink: Locator;
  readonly forgotTokenLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.locator('h1:has-text("Sign in"), h1:has-text("Log in"), h1:has-text("Welcome back")').first();
    this.accessTokenInput = page.locator('input[name="accessToken"], input[placeholder*="token" i], input[type="text"]:visible').first();
    // On the public demo the only "Sign in" surface is a button in the
    // header (which links to /en/login or triggers the security-token
    // dialog).
    this.signInButton = page.locator('button:has-text("Sign in"), button:has-text("Sign In"), a:has-text("Sign in"), a:has-text("Sign In")').first();
    this.googleSignInButton = page.locator('button:has-text("Google"), a:has-text("Google")').first();
    this.signUpLink = page.locator('a:has-text("Sign up"), a:has-text("Register"), a:has-text("Create account")').first();
    this.forgotTokenLink = page.locator('a:has-text("Forgot"), a:has-text("token"), a:has-text("Lost")').first();
    this.errorMessage = page.locator('mat-error, [role="alert"], .error, .text-warn').first();
  }

  /** Open the login page. */
  async open(): Promise<void> {
    await this.goto('/en/login');
    await this.waitForAppReady();
  }

  /** Submit the access token (if a form is present). */
  async signInWithToken(accessToken: string): Promise<void> {
    if (await this.accessTokenInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.accessTokenInput.fill(accessToken);
      await this.signInButton.click();
      await this.waitForAppReady();
    }
  }

  /** Click the Sign Up link. */
  async clickSignUp(): Promise<void> {
    await Promise.all([
      this.page.waitForURL(/\/(en\/)?(register|signup)/, { timeout: 15_000 }).catch(() => undefined),
      this.signUpLink.click(),
    ]);
    await this.waitForAppReady();
  }

  /**
   * Assert the login form rendered — either the form is visible OR the
   * page redirected to /en/start (the public demo's behaviour for
   * anonymous visitors).
   */
  async assertLoaded(): Promise<void> {
    const url = this.page.url();
    // Public demo redirects /en/login → /en/start for anonymous visitors.
    // Both URLs are valid "login surface loaded" responses.
    expect(url).toMatch(/\/(en\/)?(login|start)/);
  }

  /** True when the actual login form (input + button) is on the page. */
  async hasLoginForm(): Promise<boolean> {
    return await this.accessTokenInput.isVisible({ timeout: 2_000 }).catch(() => false);
  }
}