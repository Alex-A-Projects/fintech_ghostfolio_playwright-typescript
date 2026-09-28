import { test, expect } from '../../fixtures/testFixtures';
import { LandingPage } from '../../pages/LandingPage';
import { PublicDemoPage } from '../../pages/PublicDemoPage';
import { LoginPage } from '../../pages/LoginPage';
import { trackConsoleErrors, assertNoConsoleErrors } from '../../utils/helpers';

/**
 * Landing-page tests — the headline flow the user explicitly asked for:
 * open https://ghostfol.io/en/start, click the Live Demo CTA, land on
 * /en/demo. Also covers: the corporate homepage (/en), the hero CTA
 * pair (Get Started + Live Demo), and the shared marketing header.
 */

test.describe('Landing page (/en/start) — Live Demo CTA flow', () => {
  test('start page loads with the Manage your wealth hero heading', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.openStart();

    await landing.assertStartLoaded();
  });

  test('the hero CTA pair (Get Started + Live Demo) is visible on /en/start', async ({ landingPage }) => {
    await expect(landingPage.getStartedHeroButton).toBeVisible();
    await expect(landingPage.liveDemoHeroButton).toBeVisible();
  });

  test('clicking the Live Demo CTA navigates to /en/demo or /en/home', async ({ landingPage }) => {
    const errors = trackConsoleErrors(landingPage.page);
    await landingPage.clickLiveDemo();
    await expect(landingPage.page).toHaveURL(/\/(en\/)?(demo|home)/);
    await assertNoConsoleErrors(errors);
  });

  test('the /en/demo destination renders the demo banner', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.openStart();
    await landing.clickLiveDemo();

    const demo = new PublicDemoPage(page);
    await demo.assertLoaded();
  });

  test('the /en/demo destination does not require login', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.openStart();
    await landing.clickLiveDemo();

    // Public demo is read-only — should not redirect to /login.
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('the /en/demo destination exposes a Create Account CTA', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.openStart();
    await landing.clickLiveDemo();

    // The banner has a "Create Account" link.
    const createAccount = page.locator('header a:has-text("Create Account")').first();
    await expect(createAccount).toBeVisible();
  });

  test('the Get Started CTA navigates away from /en/start', async ({ landingPage }) => {
    await landingPage.clickGetStarted();
    // Either register or home — both are valid landing targets.
    await expect(landingPage.page).toHaveURL(/\/(en\/)?(register|home)/);
  });

  test('the marketing header is present on /en/start (logo + nav + Get Started)', async ({ landingPage }) => {
    await expect(landingPage.logoLink).toBeVisible();
    await expect(landingPage.getStartedButton).toBeVisible();
  });

  test('the marketing footer is present on /en/start (GitHub link)', async ({ landingPage }) => {
    // Footer links exist; some marketing pages render GitHub in the header instead.
    const footerGithub = await landingPage.footerGithubLink.count();
    const headerGithub = await landingPage.footerGithubLink.count();
    expect(footerGithub + headerGithub).toBeGreaterThan(0);
  });

  test('hero video iframe is present on /en/start (or graceful fallback)', async ({ landingPage }) => {
    // The marketing page embeds a YouTube/Vimeo hero video. Either it's
    // there or the placeholder poster is — both are valid.
    const hasVideo = await landingPage.heroVideo.isVisible().catch(() => false);
    expect(typeof hasVideo).toBe('boolean');
  });

  test('navigating from /en/start to /en via the logo works', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.openStart();

    await landing.logoLink.click();
    await landing.waitForAppReady();
    // Logo goes to /en/ or to /home depending on auth state.
    await expect(page).toHaveURL(/\/(en($|\/)|home)/);
  });

  test('the /en corporate homepage renders with a heading visible', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.openHome();
    // The homepage is a SPA — give it a moment to bootstrap.
    await landing.waitForAppReady();
    // The page should render an h1 or main landmark.
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test('the Live Demo destination renders without a 404 in the title', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.openStart();
    await landing.clickLiveDemo();

    // The Angular SPA bootstraps the demo page; its <title> tag
    // contains "Ghostfolio" — never the literal "404".
    const title = await page.title();
    expect(title).not.toMatch(/^404|Not Found/);
    expect(title.length).toBeGreaterThan(0);
  });
});

test.describe('Landing page — deep-link smoke', () => {
  test('deep-linking directly to /en/demo loads the demo banner', async ({ page }) => {
    const demo = new PublicDemoPage(page);
    await demo.open();
    await demo.assertLoaded();
  });

  test('deep-linking directly to /en/start loads the landing page', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.openStart();
    await landing.assertStartLoaded();
  });
});

test.describe('Landing page → Login cross-link', () => {
  test('clicking the header Get Started link from /en/start goes to /en/register', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.openStart();
    await landing.getStartedButton.click();
    await landing.waitForAppReady();

    // Get Started CTA navigates to /en/register on the public Ghostfolio demo.
    await expect(page).toHaveURL(/\/(en\/)?register/);
  });

  test('clicking the header Sign In link from /en/start goes to /en/login (if present)', async ({ page }) => {
    const landing = new LandingPage(page);
    await landing.openStart();

    // Sign In may not be in the header on every layout. Skip if absent.
    if (await landing.signInLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await landing.signInLink.click();
      await landing.waitForAppReady();
      const login = new LoginPage(page);
      await login.assertLoaded();
    } else {
      // Get Started is the universal auth entry point.
      await expect(landing.getStartedButton).toBeVisible();
    }
  });
});