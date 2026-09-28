import { test, expect } from '@playwright/test';
import {
  ping,
  getSettings,
  getSettingValue,
  upsertSetting,
  queryOne,
  getUserById,
} from '../../utils/db/dbClient';

/**
 * DB — Settings table.
 *
 * The current Ghostfolio schema has `Settings` (note plural) with a
 * single jsonb `settings` column keyed by userId — not the old per-key
 * (userId, key) rows.
 */

let dbReachable = false;

test.beforeAll(async () => {
  dbReachable = await ping();
  if (!dbReachable) {
    console.warn('[db-settings] PostgreSQL not reachable — setting tests will be skipped.');
  }
});

test.describe('DB — Settings table', () => {
  test('getSettings returns null for an unknown user', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const s = await getSettings('00000000-0000-0000-0000-000000000000');
    expect(s).toBeNull();
  });

  test('getSettingValue returns null for an unknown key (jsonb -> operator)', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const u = await queryOne<{ id: string }>(`SELECT id FROM "User" LIMIT 1`);
    if (!u) {
      test.skip();
      return;
    }
    const value = await getSettingValue(u.id, '__no_such_key_' + Date.now());
    // The PostgreSQL jsonb -> operator returns SQL NULL for missing
    // keys, which comes back as JS null (not undefined). Both are
    // semantically "no value".
    expect([null, undefined]).toContain(value as null | undefined);
  });

  test('upsertSetting creates a new settings row', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const u = await queryOne<{ id: string }>(`SELECT id FROM "User" LIMIT 1`);
    if (!u) {
      test.skip();
      return;
    }
    const key = `__test_setting_${Date.now()}`;
    await upsertSetting(u.id, key, 'one');
    try {
      const v = await getSettingValue(u.id, key);
      expect(v).toBe('one');
    } finally {
      // Clean up the test key.
      await queryOne(
        `UPDATE "Settings" SET settings = settings - $2 WHERE "userId" = $1`,
        [u.id, key]
      );
    }
  });

  test('upsertSetting updates an existing settings row (upsert behaviour)', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const u = await queryOne<{ id: string }>(`SELECT id FROM "User" LIMIT 1`);
    if (!u) {
      test.skip();
      return;
    }
    const key = `__test_setting_upsert_${Date.now()}`;
    await upsertSetting(u.id, key, 'first');
    await upsertSetting(u.id, key, 'second');
    try {
      const v = await getSettingValue(u.id, key);
      expect(v).toBe('second');
    } finally {
      await queryOne(
        `UPDATE "Settings" SET settings = settings - $2 WHERE "userId" = $1`,
        [u.id, key]
      );
    }
  });

  test('getSettings returns the full settings object for an existing user', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const u = await queryOne<{ id: string }>(`SELECT id FROM "User" LIMIT 1`);
    if (!u) {
      test.skip();
      return;
    }
    const s = await getSettings(u.id);
    // Settings may be null for a fresh user with no Settings row.
    if (s) {
      expect(s.user_id).toBe(u.id);
      expect(typeof s.settings).toBe('object');
    }
  });

  test('getUserById returns a valid id for any seeded user', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const u = await queryOne<{ id: string }>(`SELECT id FROM "User" LIMIT 1`);
    if (!u) {
      test.skip();
      return;
    }
    const full = await getUserById(u.id);
    expect(full?.id).toBe(u.id);
  });
});