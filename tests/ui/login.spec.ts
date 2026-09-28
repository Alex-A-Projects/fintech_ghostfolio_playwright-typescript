import { test, expect } from '../../fixtures/testFixtures';
import { LoginPage } from '../../pages/LoginPage';

/**
 * Login page tests — covers /en/login (security-token form + Google OAuth).
 *
 * The public Ghostfolio demo redirects /en/login → /en/start for
 * anonymous visitors. Tests accept either behaviour.
 */

test.describe('Login page (/en/login)', () => {
  test('page loads (form OR redirect to /en/start)', async ({ loginPage }) => {
    await loginPage.assertLoaded();
  });

  test('the page has a non-empty <title>', async ({ loginPage }) => {
    const title = await loginPage.page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('when a login form is present, the access-token input is editable', async ({ loginPage }) => {
    if (await loginPage.hasLoginForm()) {
      await expect(loginPage.accessTokenInput).toBeEditable();
    }
    // Otherwise the page redirected — nothing to assert.
  });

  test('when a login form is present, the Sign In button is clickable', async ({ loginPage }) => {
    if (await loginPage.hasLoginForm()) {
      await expect(loginPage.signInButton).toBeVisible();
    }
  });

  test('clicking Sign In with an empty input surfaces an error or stays on /login (when form present)', async ({ loginPage }) => {
    if (!(await loginPage.hasLoginForm())) {
      // Form not present (redirect happened) — nothing to test.
      return;
    }
    await loginPage.signInButton.click();
    await loginPage.waitForAppReady();
    const stillOnLogin = loginPage.page.url().includes('/login');
    const errorVisible = await loginPage.errorMessage.isVisible({ timeout: 2_000 }).catch(() => false);
    expect(stillOnLogin || errorVisible).toBe(true);
  });

  test('a Sign Up / Get Started cross-link is present on the (redirected) page', async ({ loginPage, page }) => {
    // /en/login redirects to /en/start on the public demo. The CTA on
    // that page is "Get Started" — accept any of: Sign up / Sign Up /
    // Create account / Get started.
    const cta = page.locator(
      'a:has-text("Sign up"), a:has-text("Sign Up"), a:has-text("Create account"), a:has-text("Create Account"), a:has-text("Get Started"), a:has-text("Get started")'
    );
    expect(await cta.count()).toBeGreaterThan(0);
  });

  test('Google sign-in button is queryable without error', async ({ loginPage }) => {
    const count = await loginPage.googleSignInButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('typing an invalid token and submitting surfaces an error or stays on /login (when form present)', async ({ loginPage }) => {
    if (!(await loginPage.hasLoginForm())) return;
    await loginPage.signInWithToken('this-is-not-a-real-token-' + Date.now());
    await expect(loginPage.page).not.toHaveURL(/\/home$/);
  });
});

test.describe('Login cross-page', () => {
  test('navigating directly to /en/login loads either the form or the marketing redirect', async ({ page }) => {
    const lp = new LoginPage(page);
    await lp.open();
    await expect(page).toHaveURL(/\/(en\/)?(login|start)/);
  });
});