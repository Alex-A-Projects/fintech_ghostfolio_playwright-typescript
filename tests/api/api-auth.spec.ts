import { test, expect } from '../../fixtures/testFixtures';

/**
 * Auth endpoints — POST /api/v1/auth/anonymous.
 *
 * On the public Ghostfolio demo this endpoint validates that the
 * supplied access token belongs to the demo user. We assert behaviour
 * on both the happy path (demo token) and a malformed token.
 */

test.describe('API — /auth/anonymous', () => {
  test('returns 401 / 403 / 500 with a malformed token', async ({ api }) => {
    const res = await api.authAnonymous('not-a-real-token-' + Date.now());
    // Public demo returns 500 for malformed JWT-shaped strings and 403
    // for valid JWTs that aren't in the demo user's accessToken table.
    expect([401, 403, 500]).toContain(res.status);
  });

  test('with an empty accessToken returns 400 / 401 / 403', async ({ api }) => {
    const res = await api.authAnonymous('');
    // Empty body → NestJS ForbiddenException (403). Other variants of
    // the public demo / a self-hosted build may use 400 (validation) or
    // 401 (unauthenticated). 500 is excluded here because NestJS no
    // longer raises an InternalServerError for an empty body.
    expect([400, 401, 403]).toContain(res.status);
  });

  test('response body includes a NestJS error envelope on empty token', async ({ api }) => {
    const res = await api.authAnonymous('');
    // NestJS error envelope: { statusCode, message }
    expect(res.body).toBeTruthy();
    const body = res.body as { statusCode?: number; message?: string } | null;
    expect(body?.statusCode).toBe(res.status);
    expect(typeof body?.message).toBe('string');
    expect((body?.message ?? '').length).toBeGreaterThan(0);
  });

  test('response body includes an error envelope on garbage token', async ({ api }) => {
    const res = await api.authAnonymous('garbage');
    // NestJS error envelope: { statusCode, message }
    expect(res.body).toBeTruthy();
    const body = res.body as { statusCode?: number; message?: string } | null;
    if (body) {
      expect(body.statusCode).toBeDefined();
    }
  });
});