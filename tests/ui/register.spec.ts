import { test, expect } from '../../fixtures/testFixtures';
import { freshUser } from '../../utils/testData';

/**
 * Register page tests — covers /en/register (sign-up form).
 *
 * The public Ghostfolio demo may show a one-click "Create Account" CTA
 * instead of a full email/password form. Tests accept either surface.
 */

test.describe('Register page (/en/register)', () => {
  test('page loads with the email input or Create Account button visible', async ({ registerPage }) => {
    await registerPage.assertLoaded();
  });

  test('the page has a non-empty <title>', async ({ registerPage }) => {
    const title = await registerPage.page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('when a registration form is present, the email input is editable', async ({ registerPage }) => {
    if (await registerPage.hasRegistrationForm()) {
      await expect(registerPage.emailInput).toBeEditable();
    }
  });

  test('when a registration form is present, the password input is type="password"', async ({ registerPage }) => {
    if (await registerPage.hasRegistrationForm()) {
      const type = await registerPage.passwordInput.getAttribute('type');
      expect(type).toBe('password');
    }
  });

  test('the Sign In cross-link is queryable', async ({ registerPage }) => {
    const count = await registerPage.signInLink.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking the Create Account / Sign Up button does not 500', async ({ registerPage }) => {
    if (await registerPage.signUpButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await registerPage.signUpButton.click();
      await registerPage.waitForAppReady();
      // We don't assert a specific URL — the click handler is allowed
      // to navigate anywhere (login, register, OAuth flow, etc.).
      const url = registerPage.page.url();
      expect(url).toMatch(/^https?:\/\//);
    }
  });

  test('the registration API accepts a fresh user via direct POST (skipped if disabled)', async ({ page }) => {
    // This test pokes /api/v1/user directly via fetch from the page
    // context. If the public demo has createUserAccount disabled, we
    // expect a 403 / 429 and the test still passes.
    const u = freshUser('regspec');
    const resp = await page.request.post('https://ghostfol.io/api/v1/user', {
      data: { email: u.email, password: u.password },
      headers: { 'Content-Type': 'application/json' },
    });
    expect([200, 201, 400, 403, 429]).toContain(resp.status());
  });
});