import { test as base, expect, Page } from '@playwright/test';
import { LandingPage } from '../pages/LandingPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { PortfolioPage } from '../pages/PortfolioPage';
import { AccountsPage } from '../pages/AccountsPage';
import { PublicDemoPage } from '../pages/PublicDemoPage';
import { AboutPage } from '../pages/AboutPage';
import { FeaturesPage } from '../pages/FeaturesPage';
import { PricingPage } from '../pages/PricingPage';
import { FAQPage } from '../pages/FAQPage';
import { ResourcesPage } from '../pages/ResourcesPage';
import { MarketsPage } from '../pages/MarketsPage';
import { ZenPage } from '../pages/ZenPage';
import { ApiClient } from '../utils/apiClient';

/**
 * Custom test fixtures:
 *
 *   Page objects for every public marketing + dashboard page.
 *   `api` — ApiClient instance scoped to the test (disposed in
 *           afterEach so we never leak request contexts).
 *
 * Authenticated flows are exercised via the API rather than the UI
 * because the public Ghostfolio demo requires a per-account JWT and we
 * cannot perform a full browser login in CI without that secret.
 */

/* -----------------------------------------------------------------------
 * Page-object fixtures
 * --------------------------------------------------------------------- */

type GhostfolioFixtures = {
  landingPage: LandingPage;
  homePage: HomePage;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  portfolioPage: PortfolioPage;
  accountsPage: AccountsPage;
  publicDemoPage: PublicDemoPage;
  aboutPage: AboutPage;
  featuresPage: FeaturesPage;
  pricingPage: PricingPage;
  faqPage: FAQPage;
  resourcesPage: ResourcesPage;
  marketsPage: MarketsPage;
  zenPage: ZenPage;
  api: ApiClient;
};

export const test = base.extend<GhostfolioFixtures>({
  landingPage: async ({ page }, use) => {
    const p = new LandingPage(page);
    await p.openStart();
    await use(p);
  },

  homePage: async ({ page }, use) => {
    const p = new HomePage(page);
    await p.open();
    await use(p);
  },

  loginPage: async ({ page }, use) => {
    const p = new LoginPage(page);
    await p.open();
    await use(p);
  },

  registerPage: async ({ page }, use) => {
    const p = new RegisterPage(page);
    await p.open();
    await use(p);
  },

  portfolioPage: async ({ page }, use) => {
    const p = new PortfolioPage(page);
    await p.open();
    await use(p);
  },

  accountsPage: async ({ page }, use) => {
    const p = new AccountsPage(page);
    await p.open();
    await use(p);
  },

  publicDemoPage: async ({ page }, use) => {
    const p = new PublicDemoPage(page);
    await p.open();
    await use(p);
  },

  aboutPage: async ({ page }, use) => {
    const p = new AboutPage(page);
    await p.open();
    await use(p);
  },

  featuresPage: async ({ page }, use) => {
    const p = new FeaturesPage(page);
    await p.open();
    await use(p);
  },

  pricingPage: async ({ page }, use) => {
    const p = new PricingPage(page);
    await p.open();
    await use(p);
  },

  faqPage: async ({ page }, use) => {
    const p = new FAQPage(page);
    await p.open();
    await use(p);
  },

  resourcesPage: async ({ page }, use) => {
    const p = new ResourcesPage(page);
    await p.open();
    await use(p);
  },

  marketsPage: async ({ page }, use) => {
    const p = new MarketsPage(page);
    await p.open();
    await use(p);
  },

  zenPage: async ({ page }, use) => {
    const p = new ZenPage(page);
    await p.open();
    await use(p);
  },

  api: async ({}, use) => {
    const client = new ApiClient();
    await use(client);
    await client.dispose();
  },
});

export { expect };
export type { Page };