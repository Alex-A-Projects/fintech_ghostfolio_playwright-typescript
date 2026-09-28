import { test, expect } from '../../fixtures/testFixtures';
import { freshUser } from '../../utils/testData';

/**
 * User endpoints — POST /user, GET /user, PUT /user/setting, POST
 * /user/access-token, DELETE /user.
 *
 * On the public Ghostfolio demo, POST /user is throttled and may be
 * disabled. We assert the negative cases (validation, 401) and the
 * happy-path only when createUserAccount is enabled in globalPermissions.
 */

test.describe('API — /user (CRUD)', () => {
  test('POST /user with empty body returns 4xx (429 may fire before validation)', async ({ api }) => {
    const res = await api.createUser({ email: '', password: '' });
    // Throttler may fire before validation on the public demo — 429 is valid.
    expect([400, 401, 403, 429]).toContain(res.status);
  });

  test('POST /user with invalid email returns 4xx (429 may fire before validation)', async ({ api }) => {
    const res = await api.createUser({ email: 'not-an-email', password: 'Passw0rd!' });
    expect([400, 401, 403, 429]).toContain(res.status);
  });

  test('POST /user with short password returns 4xx (429 may fire before validation)', async ({ api }) => {
    const res = await api.createUser({ email: 'a@b.com', password: '123' });
    expect([400, 401, 403, 429]).toContain(res.status);
  });

  test('POST /user with a fresh email creates a user (or 403/429 if disabled/throttled)', async ({ api }) => {
    const info = await api.info();
    const createEnabled = info.body?.globalPermissions?.includes('createUserAccount');

    const u = freshUser('api');
    const res = await api.createUser(u);
    if (createEnabled && (res.status === 200 || res.status === 201)) {
      expect(res.body?.id).toBeTruthy();
      expect(res.body?.accessToken).toBeTruthy();
    } else {
      // createUserAccount can also be throttled (429) on the public demo
      // even when the global permission is enabled — both 403 and 429 are
      // valid "not created" responses.
      expect([200, 201, 403, 429, 503]).toContain(res.status);
    }
  });

  test('POST /user with the same email twice does not return 500', async ({ api }) => {
    const info = await api.info();
    const createEnabled = info.body?.globalPermissions?.includes('createUserAccount');
    if (!createEnabled) {
      test.skip(true, 'createUserAccount is disabled on this host');
      return;
    }
    const u = freshUser('dup');
    const first = await api.createUser(u);
    const second = await api.createUser(u);
    // The exact outcome depends on the host configuration:
    //   - public demo: throttler returns 429 on both calls
    //   - self-hosted: first 200/201, second 409/400 (duplicate)
    //   - locked-down: both 403/503
    // What we DON'T want is the duplicate to throw an internal 500.
    expect([200, 201, 400, 403, 409, 429, 503]).toContain(first.status);
    expect([200, 201, 400, 403, 409, 429, 503]).toContain(second.status);
    // If the first call actually succeeded, the second MUST be rejected
    // (not silently accepted as a duplicate).
    if (first.status === 200 || first.status === 201) {
      expect([400, 403, 409, 429]).toContain(second.status);
    }
  });

  test('GET /user with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.userMe();
    expect(res.status).toBe(401);
  });

  test('GET /user with an invalid bearer returns 401', async ({ api }) => {
    api.setBearer('totally-fake-bearer');
    const res = await api.userMe();
    expect(res.status).toBe(401);
  });
});

test.describe('API — /user/setting', () => {
  test('PUT /user/setting with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.updateSetting('language', 'en');
    expect(res.status).toBe(401);
  });
});

test.describe('API — /user/access-token', () => {
  test('POST /user/access-token with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.rotateOwnAccessToken();
    expect(res.status).toBe(401);
  });
});

test.describe('API — DELETE /user', () => {
  test('DELETE /user with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.deleteUser();
    expect(res.status).toBe(401);
  });
});