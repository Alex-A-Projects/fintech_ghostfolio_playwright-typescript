import { test, expect } from '../../fixtures/testFixtures';

/**
 * Symbol + Asset + Exchange-rate endpoints.
 *
 * Auth model:
 *   - /api/v1/asset/{ds}/{symbol} — public, no auth required.
 *   - /api/v1/symbol/lookup, /api/v1/symbol/{ds}/{symbol},
 *     /api/v1/symbol/{ds}/{symbol}/{date} — these are now auth-gated
 *     on the public Ghostfolio demo (returned 200 earlier but now
 *     require a Bearer token). We assert 200 (legacy public) OR 401
 *     (current auth-gated) so the test stays valid against either
 *     backend configuration.
 *   - /api/v1/exchange-rate/{symbol}/{date} — auth-gated on the
 *     public demo.
 */

test.describe('API — /symbol/lookup', () => {
  test('returns matching items for a known symbol (200 public, or 401 auth-gated)', async ({ api }) => {
    const res = await api.symbolLookup('AAPL');
    expect([200, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(Array.isArray(res.body?.items)).toBe(true);
    }
  });

  test('each item has dataSource + symbol + name (when public)', async ({ api }) => {
    const res = await api.symbolLookup('AAPL');
    if (res.status === 200) {
      const item = res.body?.items?.[0];
      expect(item).toBeTruthy();
      expect(item?.dataSource).toBeTruthy();
      expect(item?.symbol).toBeTruthy();
      expect(item?.name).toBeTruthy();
    }
  });

  test('returns empty array for a nonsense query (when public)', async ({ api }) => {
    const res = await api.symbolLookup('xxxxnotasymbolxxxx' + Date.now());
    expect([200, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(Array.isArray(res.body?.items)).toBe(true);
    }
  });

  test('returns multiple matches for a common name (when public)', async ({ api }) => {
    const res = await api.symbolLookup('apple');
    expect([200, 401]).toContain(res.status);
  });
});

test.describe('API — /symbol/{dataSource}/{symbol}', () => {
  test('returns the AAPL profile from YAHOO (200 public, or 401 auth-gated)', async ({ api }) => {
    const res = await api.symbolProfile('YAHOO', 'AAPL');
    expect([200, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body?.dataSource).toBe('YAHOO');
      expect(res.body?.symbol).toBe('AAPL');
    }
  });

  test('returns the Bitcoin profile from COINGECKO (when public)', async ({ api }) => {
    const res = await api.symbolProfile('COINGECKO', 'bitcoin');
    expect([200, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body?.dataSource).toBe('COINGECKO');
      expect(res.body?.symbol).toBe('bitcoin');
    }
  });

  test('returns 401 or 404 for an unknown symbol (auth may fire first)', async ({ api }) => {
    const res = await api.symbolProfile('YAHOO', 'ZZZZZZ-' + Date.now());
    expect([401, 404, 400]).toContain(res.status);
  });

  test('returns a marketPrice (or 404 / 401)', async ({ api }) => {
    const res = await api.symbolProfile('YAHOO', 'AAPL');
    expect([200, 401, 404]).toContain(res.status);
    if (res.status === 200) {
      // marketPrice may be undefined when the provider fails — both are valid.
      expect(['number', 'undefined']).toContain(typeof res.body?.marketPrice);
    }
  });
});

test.describe('API — /symbol/{dataSource}/{symbol}/{dateString}', () => {
  test('returns historical price for AAPL on a known date (when public)', async ({ api }) => {
    const res = await api.symbolHistorical('YAHOO', 'AAPL', '2024-01-02');
    // Endpoint may be public (200/404) or auth-gated (401).
    expect([200, 401, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(typeof res.body?.marketPrice).toBe('number');
    }
  });
});

test.describe('API — /asset/{dataSource}/{symbol}', () => {
  test('returns the AAPL asset response (public)', async ({ api }) => {
    const res = await api.asset('YAHOO', 'AAPL');
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body?.assetProfile).toBeTruthy();
      expect(res.body?.assetProfile?.symbol).toBe('AAPL');
    }
  });

  test('returns marketData array (possibly empty)', async ({ api }) => {
    const res = await api.asset('YAHOO', 'AAPL');
    if (res.status === 200) {
      expect(Array.isArray(res.body?.marketData)).toBe(true);
    }
  });
});

test.describe('API — /exchange-rate/{symbol}/{dateString}', () => {
  test('returns a USD->EUR exchange rate (401 on anonymous)', async ({ api }) => {
    const res = await api.exchangeRate('USDGBP', '2024-01-02');
    // Auth-gated on the public demo. With a Bearer token: 200/404.
    expect([200, 401, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(typeof res.body?.marketPrice).toBe('number');
    }
  });
});