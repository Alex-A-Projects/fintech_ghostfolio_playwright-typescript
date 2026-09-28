import { test, expect } from '@playwright/test';
import {
  ping,
  userCount,
  getUserByAccessToken,
  getUserById,
  deleteUserById,
  insertUser,
  insertAccount,
  upsertSetting,
  query,
  queryOne,
} from '../../utils/db/dbClient';

/**
 * DB integration — exercises the full dbClient helper round-trip
 * against a real PostgreSQL instance. We insert users directly via
 * SQL (instead of via the public Ghostfolio API) because the public
 * API rate-limits `POST /user` and the suite would otherwise self-skip.
 *
 * Skips itself when the DB is unreachable.
 */

let dbReachable = false;

test.beforeAll(async () => {
  dbReachable = await ping();
  if (!dbReachable) {
    console.warn('[db-integration] PostgreSQL not reachable — integration tests will be skipped.');
  }
});

/**
 * Insert a brand-new user directly via SQL. Returns the id + the
 * synthetic access token we wrote. Cleans up via deleteUserById in
 * the test's afterEach / try-finally.
 */
async function createFreshUser(
  prefix = 'dbint'
): Promise<{ id: string; accessToken: string } | null> {
  if (!dbReachable) return null;
  const id = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const accessToken = `${prefix}_token_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  await insertUser({ id, accessToken, role: 'USER' });
  return { id, accessToken };
}

test.describe('DB integration — user insert + read round-trip', () => {
  test('insertUser inserts a row visible to userCount', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const before = await userCount();
    const created = await createFreshUser();
    if (!created) {
      test.skip();
      return;
    }
    try {
      const after = await userCount();
      expect(after).toBe(before + 1);

      const row = await getUserByAccessToken(created.accessToken);
      expect(row).not.toBeNull();
      expect(row?.id).toBe(created.id);
      expect(row?.role).toBe('USER');
    } finally {
      await deleteUserById(created.id);
    }
  });

  test('the inserted user row has a non-null accessToken column', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const created = await createFreshUser();
    if (!created) {
      test.skip();
      return;
    }
    try {
      const row = await queryOne<{ access_token: string | null }>(
        `SELECT "accessToken" AS access_token FROM "User" WHERE id = $1`,
        [created.id]
      );
      expect(row?.access_token).toBe(created.accessToken);
      expect((row?.access_token ?? '').length).toBeGreaterThan(10);
    } finally {
      await deleteUserById(created.id);
    }
  });

  test('the inserted user row has the USER role', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const created = await createFreshUser();
    if (!created) {
      test.skip();
      return;
    }
    try {
      const row = await queryOne<{ role: string }>(
        `SELECT role::text AS role FROM "User" WHERE id = $1`,
        [created.id]
      );
      expect(row?.role).toBe('USER');
    } finally {
      await deleteUserById(created.id);
    }
  });

  test('inserting an ADMIN user produces an ADMIN role', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const id = `dbint-admin-${Date.now()}`;
    await insertUser({ id, accessToken: 'admin-token-' + Date.now(), role: 'ADMIN' });
    try {
      const row = await getUserById(id);
      expect(row?.role).toBe('ADMIN');
    } finally {
      await deleteUserById(id);
    }
  });

  test('userExistsByAccessToken matches a freshly-inserted token', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const created = await createFreshUser();
    if (!created) {
      test.skip();
      return;
    }
    try {
      const row = await queryOne<{ exists: boolean }>(
        `SELECT EXISTS(SELECT 1 FROM "User" WHERE "accessToken" = $1) AS exists`,
        [created.accessToken]
      );
      expect(Boolean(row?.exists)).toBe(true);
    } finally {
      await deleteUserById(created.id);
    }
  });
});

test.describe('DB integration — cascading deletes', () => {
  test('deleting a user via SQL cascades to dependent Account rows', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const created = await createFreshUser('cascade-acct');
    if (!created) {
      test.skip();
      return;
    }

    // Add a dependent Account row.
    await insertAccount({
      id: `${created.id}-acct`,
      userId: created.id,
      name: 'Integration Test Account',
      currency: 'USD',
    });

    try {
      const accountsBefore = await query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM "Account" WHERE "userId" = $1`,
        [created.id]
      );
      expect(Number(accountsBefore[0]?.count ?? 0)).toBeGreaterThanOrEqual(1);

      await deleteUserById(created.id);

      const accountsAfter = await query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM "Account" WHERE "userId" = $1`,
        [created.id]
      );
      expect(Number(accountsAfter[0]?.count ?? 0)).toBe(0);
    } finally {
      // deleteUserById already removed the user; clean up the account
      // row directly so the schema stays tidy even if the test exits
      // before the cascade fires.
      await query(`DELETE FROM "Account" WHERE "userId" = $1`, [created.id]).catch(
        () => undefined
      );
    }
  });

  test('deleting a user cascades to a Settings row', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const created = await createFreshUser('cascade-settings');
    if (!created) {
      test.skip();
      return;
    }
    await upsertSetting(created.id, 'language', 'en');

    try {
      const before = await query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM "Settings" WHERE "userId" = $1`,
        [created.id]
      );
      expect(Number(before[0]?.count ?? 0)).toBeGreaterThanOrEqual(1);

      await deleteUserById(created.id);

      const after = await query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM "Settings" WHERE "userId" = $1`,
        [created.id]
      );
      expect(Number(after[0]?.count ?? 0)).toBe(0);
    } finally {
      // already cleaned via cascade — no-op
    }
  });

  test('getUserByAccessToken returns null after the user is deleted', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const created = await createFreshUser();
    if (!created) {
      test.skip();
      return;
    }
    await deleteUserById(created.id);

    const after = await getUserByAccessToken(created.accessToken);
    expect(after).toBeNull();
  });

  test('userCount returns to the original value after cleanup', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const before = await userCount();
    const created = await createFreshUser();
    if (!created) {
      test.skip();
      return;
    }
    await deleteUserById(created.id);
    const after = await userCount();
    expect(after).toBe(before);
  });
});

test.describe('DB integration — concurrent inserts', () => {
  test('inserting 5 users in sequence leaves userCount increased by 5', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const before = await userCount();
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      const created = await createFreshUser(`concurrent-${i}`);
      if (created) ids.push(created.id);
    }
    try {
      const after = await userCount();
      expect(after).toBe(before + ids.length);
    } finally {
      for (const id of ids) {
        await deleteUserById(id).catch(() => undefined);
      }
    }
  });

  test('inserting two users with the same id is idempotent (no duplicate)', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const id = `dbint-dup-${Date.now()}`;
    const accessToken = `dup-token-${Date.now()}`;
    const before = await userCount();
    try {
      await insertUser({ id, accessToken });
      // Second insert with the same id but different token — insertUser
      // uses ON CONFLICT DO NOTHING, so the row count should not change.
      await insertUser({ id, accessToken: accessToken + '-2' });
      const after = await userCount();
      expect(after).toBe(before + 1);

      const row = await getUserById(id);
      // The original token wins because ON CONFLICT DO NOTHING leaves
      // the existing row untouched.
      expect(row?.access_token).toBe(accessToken);
    } finally {
      await deleteUserById(id).catch(() => undefined);
    }
  });
});