import { test, expect } from '../../fixtures/testFixtures';

/**
 * Public, no-auth endpoints — auth gate behaviour.
 *
 * These endpoints all require either an Anonymous JWT or a Bearer
 * token. With no auth we expect 401 from each.
 */

test.describe('API — auth gate (negative)', () => {
  test('GET /user returns 401 without bearer', async ({ api }) => {
    api.setBearer(null);
    const res = await api.userMe();
    expect(res.status).toBe(401);
  });

  test('GET /account returns 401 without bearer', async ({ api }) => {
    api.setBearer(null);
    const res = await api.listAccounts();
    expect(res.status).toBe(401);
  });

  test('GET /activities returns 401 without bearer', async ({ api }) => {
    api.setBearer(null);
    const res = await api.listActivities();
    expect(res.status).toBe(401);
  });

  test('GET /portfolio/details returns 401 without bearer', async ({ api }) => {
    api.setBearer(null);
    const res = await api.portfolioDetails();
    expect(res.status).toBe(401);
  });

  test('GET /export returns 401 without bearer', async ({ api }) => {
    api.setBearer(null);
    const res = await api.exportPortfolio();
    expect(res.status).toBe(401);
  });

  test('GET /portfolio/holdings returns 401 without bearer', async ({ api }) => {
    api.setBearer(null);
    const res = await api.portfolioHoldings();
    expect(res.status).toBe(401);
  });

  test('GET /portfolio/performance returns 401 without bearer', async ({ api }) => {
    api.setBearer(null);
    const res = await api.portfolioPerformance();
    expect(res.status).toBe(401);
  });

  test('GET /portfolio/dividends returns 401 without bearer', async ({ api }) => {
    api.setBearer(null);
    const res = await api.portfolioDividends();
    expect(res.status).toBe(401);
  });

  test('GET /portfolio/investments returns 401 without bearer', async ({ api }) => {
    api.setBearer(null);
    const res = await api.portfolioInvestments();
    expect(res.status).toBe(401);
  });
});

test.describe('API — public portfolio (/public/{accessId}/portfolio)', () => {
  test('returns portfolio (or 404) for a random access id', async ({ api }) => {
    const res = await api.publicPortfolio('random-access-id-' + Date.now());
    expect([200, 404]).toContain(res.status);
  });

  test('returns portfolio for the demo token access id', async ({ api }) => {
    const info = await api.info();
    const demoToken = info.body?.demoAuthToken ?? '';
    if (demoToken) {
      const res = await api.publicPortfolio(demoToken);
      // 200 if the demo token is also a public access id; otherwise 404.
      expect([200, 404]).toContain(res.status);
    }
  });

  test('does NOT require a Bearer token', async ({ api }) => {
    api.setBearer(null);
    const res = await api.publicPortfolio('xxx');
    // It must not be 401 — public endpoint.
    expect(res.status).not.toBe(401);
  });
});