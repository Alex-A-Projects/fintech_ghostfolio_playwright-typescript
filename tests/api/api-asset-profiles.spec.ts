import { test, expect } from '../../fixtures/testFixtures';

/**
 * Asset profile endpoints — PATCH /api/v1/asset-profiles/{ds}/{symbol}.
 *
 * Requires an admin Bearer token. We test the negative auth paths.
 */

test.describe('API — /asset-profiles (admin-only)', () => {
  test('PATCH with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.patchAssetProfile('YAHOO', 'AAPL', {
      sectors: [{ name: 'Technology', weight: 1 }],
    });
    expect(res.status).toBe(401);
  });

  test('PATCH with a non-admin bearer returns 401 / 403', async ({ api }) => {
    api.setBearer('not-a-real-jwt');
    const res = await api.patchAssetProfile('YAHOO', 'AAPL', {
      sectors: [{ name: 'Technology', weight: 1 }],
    });
    expect([401, 403]).toContain(res.status);
  });
});