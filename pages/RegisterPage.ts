import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * RegisterPage — public sign-up form at /en/register.
 *
 * Required fields: email, password, confirm password, role (analytics
 * only). Submitting a brand-new email creates a new Ghostfolio account
 * and logs the user in (no email verification on self-hosted builds).
 *
 * The /api/v1/user endpoint exposes an identical shape for programmatic
 * signup — see api-user.spec.ts.
 */
export class RegisterPage extends BasePage {
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly roleToggle: Locator;
  readonly signUpButton: Locator;
  readonly signInLink: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.locator('h1:has-text("Sign up"), h1:has-text("Create"), h1:has-text("Register")').first();
    this.emailInput = page.locator('input[name="email"], input[type="email"]').first();
    this.passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    this.confirmPasswordInput = page.locator('input[name*="confirm"], input[name*="repeat"]').first();
    this.roleToggle = page.locator('mat-button-toggle-group, [role="radiogroup"]').first();
    this.signUpButton = page.locator('button:has-text("Create Account"), button:has-text("Sign up"), button[type="submit"]').first();
    this.signInLink = page.locator('a:has-text("Sign in"), a:has-text("Log in"), button:has-text("Sign in"), button:has-text("Sign In")').first();
    this.errorMessage = page.locator('mat-error, [role="alert"]').first();
    this.successMessage = page.locator('mat-card:has-text("Welcome"), mat-card:has-text("Success")').first();
  }

  /** Open the registration page. */
  async open(): Promise<void> {
    await this.goto('/en/register');
    await this.waitForAppReady();
  }

  /** Submit the registration form (if a form is present). */
  async register(email: string, password: string): Promise<void> {
    if (await this.emailInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await this.emailInput.fill(email);
      await this.passwordInput.fill(password);
      if (await this.confirmPasswordInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await this.confirmPasswordInput.fill(password);
      }
      await this.signUpButton.click();
      await this.waitForAppReady();
    }
  }

  /** Click "Sign in" link to go back to the login page. */
  async clickSignIn(): Promise<void> {
    if (await this.signInLink.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await Promise.all([
        this.page.waitForURL(/\/(en\/)?(login|start)/, { timeout: 15_000 }).catch(() => undefined),
        this.signInLink.click(),
      ]);
      await this.waitForAppReady();
    }
  }

  /**
   * Assert the registration page rendered — either a form is present
   * OR a "Create Account" CTA is rendered.
   */
  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/(en\/)?register/);
    // The page either has a form (self-hosted) or a Create Account button
    // (public demo). Both are valid.
    await expect(this.emailInput.or(this.signUpButton)).toBeVisible({ timeout: 5_000 });
  }

  /** True when an actual form with email + password is present. */
  async hasRegistrationForm(): Promise<boolean> {
    return await this.emailInput.isVisible({ timeout: 2_000 }).catch(() => false);
  }
}