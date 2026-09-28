import { test, expect } from '../../fixtures/testFixtures';

/**
 * GET /api/v1/info — public server information.
 *
 * Returns supported currencies, benchmarks, demo token, global
 * permissions, statistics. Used by both the marketing site and the
 * admin overview.
 */

test.describe('API — /info', () => {
  test('returns 200 with a baseCurrency field', async ({ api }) => {
    const res = await api.info();
    expect(res.status).toBe(200);
    expect(res.body?.baseCurrency).toBeTruthy();
    expect(typeof res.body?.baseCurrency).toBe('string');
  });

  test('returns a non-empty currencies array', async ({ api }) => {
    const res = await api.info();
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.currencies)).toBe(true);
    expect((res.body?.currencies ?? []).length).toBeGreaterThan(0);
  });

  test('currencies array contains common fiat (USD, EUR, GBP)', async ({ api }) => {
    const res = await api.info();
    const currencies = res.body?.currencies ?? [];
    expect(currencies).toContain('USD');
    expect(currencies).toContain('EUR');
    expect(currencies).toContain('GBP');
  });

  test('returns a non-empty benchmarks array', async ({ api }) => {
    const res = await api.info();
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.benchmarks)).toBe(true);
    expect((res.body?.benchmarks ?? []).length).toBeGreaterThan(0);
  });

  test('benchmarks have dataSource / id / name / symbol fields', async ({ api }) => {
    const res = await api.info();
    const benchmark = res.body?.benchmarks?.[0];
    expect(benchmark).toBeTruthy();
    expect(benchmark?.dataSource).toBeTruthy();
    expect(benchmark?.id).toBeTruthy();
    expect(benchmark?.name).toBeTruthy();
    expect(benchmark?.symbol).toBeTruthy();
  });

  test('returns a demoAuthToken for browser login', async ({ api }) => {
    const res = await api.info();
    expect(res.body?.demoAuthToken).toBeTruthy();
    expect(typeof res.body?.demoAuthToken).toBe('string');
    expect(res.body?.demoAuthToken.length).toBeGreaterThan(20);
  });

  test('returns globalPermissions array', async ({ api }) => {
    const res = await api.info();
    expect(Array.isArray(res.body?.globalPermissions)).toBe(true);
  });

  test('returns statistics with user counts', async ({ api }) => {
    const res = await api.info();
    expect(res.body?.statistics).toBeTruthy();
    expect(typeof res.body?.statistics?.activeUsers1d).toBe('number');
    expect(typeof res.body?.statistics?.activeUsers30d).toBe('number');
    expect(typeof res.body?.statistics?.newUsers30d).toBe('number');
  });

  test('returns countriesOfSubscribers array (non-empty)', async ({ api }) => {
    const res = await api.info();
    expect(Array.isArray(res.body?.countriesOfSubscribers)).toBe(true);
    expect((res.body?.countriesOfSubscribers ?? []).length).toBeGreaterThan(0);
  });

  test('is reachable on every call (3/3 probes)', async ({ api }) => {
    for (let i = 0; i < 3; i++) {
      const res = await api.info();
      expect(res.status).toBe(200);
    }
  });
});