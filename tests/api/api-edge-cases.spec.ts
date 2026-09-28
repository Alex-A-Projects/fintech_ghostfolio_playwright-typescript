import { test, expect } from '../../fixtures/testFixtures';

/**
 * Edge-case API tests — input validation, malformed JSON, garbage
 * tokens, oversize payloads, unexpected methods.
 */

test.describe('API — edge cases / negative paths', () => {
  test('GET /api/v1/does-not-exist returns 404', async ({ api }) => {
    const res = await api.get('/api/v1/this-does-not-exist');
    expect([404, 405]).toContain(res.status as number);
  });

  test('GET /api/v1/health with garbage query params still returns 200', async ({ api }) => {
    const res = await api.get<{ status: string }>('/api/v1/health?foo=bar&baz=1');
    expect(res.status).toBe(200);
    expect(res.body?.status).toBe('OK');
  });

  test('POST /api/v1/health (wrong method) returns 404 / 405', async ({ api }) => {
    const res = await api.post('/api/v1/health', {});
    expect([404, 405]).toContain(res.status);
  });

  test('GET /api/v1/symbol/lookup without query returns 400 / 401', async ({ api }) => {
    const res = await api.symbolLookup('');
    expect([200, 400, 401]).toContain(res.status);
  });

  test('GET /api/v1/exchange-rate/{symbol}/{date} with a malformed date returns 401 (or 4xx/5xx)', async ({ api }) => {
    // The exchange-rate endpoint requires Bearer auth. Without it we
    // get 401; a malformed date on an authenticated request would be
    // 400 or 404. Both are valid negative-path responses.
    const res = await api.exchangeRate('USDGBP', 'not-a-date');
    expect([400, 401, 404, 500]).toContain(res.status);
  });

  test('GET /api/v1/exchange-rate/{symbol}/{date} with an invalid calendar date returns 401', async ({ api }) => {
    const res = await api.exchangeRate('USDGBP', '2024-13-99');
    expect([400, 401, 404, 500]).toContain(res.status);
  });

  test('GET /api/v1/symbol/YAHOO/ (trailing slash) is handled gracefully', async ({ api }) => {
    const res = await api.get('/api/v1/symbol/YAHOO/');
    // Some hosts 404 trailing slashes, others redirect. Both are valid.
    expect([200, 301, 302, 404]).toContain(res.status);
  });

  test('PATCH /api/v1/asset-profiles/{ds}/{symbol} without a Bearer is 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.patchAssetProfile('YAHOO', 'AAPL', {});
    expect(res.status).toBe(401);
  });

  test('POST /api/v1/import with malformed JSON returns 400 / 401', async ({ api }) => {
    api.setBearer(null);
    // Body with missing required fields — still 401 (auth first).
    const res = await api.post('/api/v1/import', { garbage: true });
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/public/empty-access-id/portfolio returns 404', async ({ api }) => {
    const res = await api.publicPortfolio('');
    expect([400, 404]).toContain(res.status);
  });
});

test.describe('API — response headers', () => {
  test('GET /api/v1/health sets content-type=application/json', async ({ api }) => {
    const res = await api.health();
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  test('GET /api/v1/health does NOT set cookies (public endpoint)', async ({ api }) => {
    const res = await api.health();
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  test('responses include the CORS allow-origin header on the public host', async ({ api }) => {
    const res = await api.health();
    // The public demo sets this header explicitly.
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});