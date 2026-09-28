import { test, expect } from '@playwright/test';
import {
  ping,
  userCount,
  getUserById,
  userExistsByAccessToken,
  deleteUserById,
  queryOne,
} from '../../utils/db/dbClient';
import { ApiClient } from '../../utils/apiClient';
import { freshUser } from '../../utils/testData';

/**
 * DB — User table.
 *
 * Creates a fresh user via /api/v1/user and asserts the row landed in
 * PostgreSQL with the right shape (id, accessToken, role). Then deletes
 * it via direct SQL (Prisma cascade).
 */

let dbReachable = false;

test.beforeAll(async () => {
  dbReachable = await ping();
  if (!dbReachable) {
    console.warn('[db-users] PostgreSQL not reachable — user tests will be skipped.');
  }
});

async function createUserViaApi(): Promise<{ id: string; accessToken: string } | null> {
  const info = await new ApiClient().info();
  if (!info.body?.globalPermissions?.includes('createUserAccount')) {
    return null;
  }
  const api = new ApiClient();
  try {
    const u = freshUser('dbuser');
    const res = await api.createUser(u);
    if (res.status !== 200 && res.status !== 201) return null;
    return { id: res.body?.id ?? '', accessToken: res.body?.accessToken ?? '' };
  } finally {
    await api.dispose();
  }
}

test.describe('DB — User table', () => {
  test('userCount returns a non-negative integer', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const before = await userCount();
    expect(before).toBeGreaterThanOrEqual(0);

    const created = await createUserViaApi();
    if (created) {
      const after = await userCount();
      expect(after).toBe(before + 1);

      // Clean up.
      await deleteUserById(created.id);
    }
  });

  test('getUserById returns the created user', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const created = await createUserViaApi();
    if (!created) {
      test.skip();
      return;
    }
    try {
      const u = await getUserById(created.id);
      expect(u).not.toBeNull();
      expect(u?.id).toBe(created.id);
      expect(u?.role).toBeTruthy();
    } finally {
      await deleteUserById(created.id);
    }
  });

  test('userExistsByAccessToken matches the freshly-created token', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const created = await createUserViaApi();
    if (!created) {
      test.skip();
      return;
    }
    try {
      expect(await userExistsByAccessToken(created.accessToken)).toBe(true);
    } finally {
      await deleteUserById(created.id);
    }
  });

  test('userExistsByAccessToken returns false for a garbage token', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    expect(await userExistsByAccessToken('garbage-' + Date.now())).toBe(false);
  });

  test('getUserById returns null for an unknown id', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const u = await getUserById('00000000-0000-0000-0000-000000000000');
    expect(u).toBeNull();
  });

  test('created user has a valid role enum (USER or ADMIN)', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const created = await createUserViaApi();
    if (!created) {
      test.skip();
      return;
    }
    try {
      const row = await queryOne<{ role: string }>(
        `SELECT role FROM "User" WHERE id = $1`,
        [created.id]
      );
      expect(row?.role).toMatch(/^(USER|ADMIN)$/);
    } finally {
      await deleteUserById(created.id);
    }
  });

  test('deleteUserById removes exactly one row', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const created = await createUserViaApi();
    if (!created) {
      test.skip();
      return;
    }
    const deleted = await deleteUserById(created.id);
    expect(deleted).toBe(1);

    const after = await getUserById(created.id);
    expect(after).toBeNull();
  });

  test('deleteUserById returns 0 when the user does not exist', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const deleted = await deleteUserById('00000000-0000-0000-0000-000000000000');
    expect(deleted).toBe(0);
  });
});