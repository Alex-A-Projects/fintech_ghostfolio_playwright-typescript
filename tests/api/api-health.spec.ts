import { test, expect } from '../../fixtures/testFixtures';

/**
 * GET /api/v1/health — service health check.
 *
 * No authentication required. Returns 200 + { status: 'OK' } when the
 * API is healthy.
 */

test.describe('API — /health', () => {
  test('returns 200 + status "OK"', async ({ api }) => {
    const res = await api.health();
    expect(res.status).toBe(200);
    expect(res.body?.status).toBe('OK');
  });

  test('response is JSON', async ({ api }) => {
    const res = await api.get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  test('is reachable on every call (5/5 probes)', async ({ api }) => {
    for (let i = 0; i < 5; i++) {
      const res = await api.health();
      expect(res.status).toBe(200);
    }
  });
});