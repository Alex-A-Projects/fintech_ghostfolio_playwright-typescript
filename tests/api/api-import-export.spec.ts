import { test, expect } from '../../fixtures/testFixtures';
import { buyActivity } from '../../utils/testData';

/**
 * Import / Export — Bearer-protected portfolio round-trip.
 *
 * The import endpoint accepts a list of activities and creates them
 * under the user's default account. The export endpoint returns the
 * user's full portfolio (meta + activities + accounts).
 */

test.describe('API — /export', () => {
  test('with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.exportPortfolio();
    expect(res.status).toBe(401);
  });

  test('with an invalid bearer returns 401', async ({ api }) => {
    api.setBearer('not-a-real-jwt');
    const res = await api.exportPortfolio();
    expect(res.status).toBe(401);
  });
});

test.describe('API — /import', () => {
  test('with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.importPortfolio({ activities: [buyActivity() as never] });
    expect(res.status).toBe(401);
  });

  test('with an empty activities list still requires auth', async ({ api }) => {
    api.setBearer(null);
    const res = await api.importPortfolio({ activities: [] });
    expect(res.status).toBe(401);
  });

  test('with an invalid bearer returns 401', async ({ api }) => {
    api.setBearer('not-a-real-jwt');
    const res = await api.importPortfolio({ activities: [buyActivity() as never] });
    expect(res.status).toBe(401);
  });
});