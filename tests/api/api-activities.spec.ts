import { test, expect } from '../../fixtures/testFixtures';

/**
 * Activity endpoints — CRUD on /api/v1/activities.
 *
 * Covers the negative auth paths. Happy-path flows (create + read +
 * update + delete) are documented but not asserted here — those
 * require a real bearer token which the demo host only issues to a
 * freshly-created account. See api-user.spec.ts.
 */

test.describe('API — /activities (negative)', () => {
  test('GET /activities with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.listActivities();
    expect(res.status).toBe(401);
  });

  test('GET /activities/{id} with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.getActivity('any-id');
    expect(res.status).toBe(401);
  });

  test('POST /activities with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.createActivity({
      accountId: 'xxx',
      symbol: 'AAPL',
      dataSource: 'YAHOO',
      date: '2024-01-02',
      quantity: 1,
      unitPrice: 100,
      fee: 0,
      currency: 'USD',
      type: 'BUY',
    });
    expect(res.status).toBe(401);
  });

  test('PUT /activities/{id} with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.updateActivity('any-id', { unitPrice: 200 });
    expect(res.status).toBe(401);
  });

  test('DELETE /activities/{id} with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.deleteActivity('any-id');
    expect(res.status).toBe(401);
  });

  test('DELETE /activities (bulk) with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.deleteActivities({ activityIds: ['a', 'b'] });
    expect(res.status).toBe(401);
  });
});

test.describe('API — /activities (input validation)', () => {
  test('GET /activities with a date filter does not 500', async ({ api }) => {
    api.setBearer(null);
    // Without a bearer this should be 401, never 500.
    const res = await api.listActivities({ startDate: '2024-01-01', endDate: '2024-12-31' });
    expect(res.status).toBe(401);
  });
});