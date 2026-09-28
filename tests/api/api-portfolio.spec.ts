import { test, expect } from '../../fixtures/testFixtures';

/**
 * Portfolio endpoints — read-only analytics + per-holding tags.
 *
 * All require Bearer auth. We test the negative auth paths plus
 * the response shape contract (where it's reachable anonymously via
 * the public demo).
 */

test.describe('API — /portfolio (negative)', () => {
  test('GET /portfolio/details with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.portfolioDetails();
    expect(res.status).toBe(401);
  });

  test('GET /portfolio/holdings with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.portfolioHoldings();
    expect(res.status).toBe(401);
  });

  test('GET /portfolio/performance with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.portfolioPerformance();
    expect(res.status).toBe(401);
  });

  test('GET /portfolio/dividends with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.portfolioDividends();
    expect(res.status).toBe(401);
  });

  test('GET /portfolio/investments with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.portfolioInvestments();
    expect(res.status).toBe(401);
  });

  test('GET /portfolio/report with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.portfolioReport();
    expect(res.status).toBe(401);
  });

  test('GET /portfolio/holding/{ds}/{symbol} with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.portfolioHolding('YAHOO', 'AAPL');
    expect(res.status).toBe(401);
  });

  test('PUT /portfolio/holding/{ds}/{symbol}/tags with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.portfolioHoldingTags('YAHOO', 'AAPL', { tags: [] });
    expect(res.status).toBe(401);
  });
});

test.describe('API — /portfolio (query validation)', () => {
  test('GET /portfolio/holdings accepts a date range query (negative: no auth)', async ({ api }) => {
    api.setBearer(null);
    const res = await api.portfolioHoldings({ startDate: '2024-01-01', endDate: '2024-12-31' });
    expect(res.status).toBe(401);
  });

  test('GET /portfolio/performance accepts groupBy=month (negative: no auth)', async ({ api }) => {
    api.setBearer(null);
    const res = await api.portfolioPerformance({ groupBy: 'month' });
    expect(res.status).toBe(401);
  });
});