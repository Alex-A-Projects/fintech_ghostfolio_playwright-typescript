import { test, expect } from '@playwright/test';
import {
  ping,
  getAccountById,
  getAccountsByUser,
  accountCountForUser,
  queryOne,
} from '../../utils/db/dbClient';

/**
 * DB — Account table.
 *
 * The current Ghostfolio schema stores balance-derived state in the
 * `Order` table (and `AccountBalance` for time-series), not on
 * `Account` directly. `Account` only carries: id, userId, name,
 * currency, platformId, comment.
 */

let dbReachable = false;

test.beforeAll(async () => {
  dbReachable = await ping();
  if (!dbReachable) {
    console.warn('[db-accounts] PostgreSQL not reachable — account tests will be skipped.');
  }
});

test.describe('DB — Account table', () => {
  test('accountCountForUser returns a non-negative integer', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const u = await queryOne<{ id: string }>(`SELECT id FROM "User" LIMIT 1`);
    if (!u) {
      test.skip();
      return;
    }
    const count = await accountCountForUser(u.id);
    expect(count).toBeGreaterThanOrEqual(0);
    expect(typeof count).toBe('number');
  });

  test('getAccountsByUser returns the same count as accountCountForUser', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const u = await queryOne<{ id: string }>(`SELECT id FROM "User" LIMIT 1`);
    if (!u) {
      test.skip();
      return;
    }
    const accounts = await getAccountsByUser(u.id);
    const count = await accountCountForUser(u.id);
    expect(accounts.length).toBe(count);
  });

  test('each account row has the expected shape', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const u = await queryOne<{ id: string }>(`SELECT id FROM "User" LIMIT 1`);
    if (!u) {
      test.skip();
      return;
    }
    const accounts = await getAccountsByUser(u.id);
    for (const acc of accounts.slice(0, 5)) {
      expect(acc.id).toBeTruthy();
      expect(acc.user_id).toBe(u.id);
      expect(acc.name).toBeTruthy();
      expect(acc.currency).toBeTruthy();
    }
  });

  test('getAccountById returns null for an unknown id', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const acc = await getAccountById('00000000-0000-0000-0000-000000000000');
    expect(acc).toBeNull();
  });

  test('an account with a platformId references an existing platform', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const acc = await queryOne<{ platform_id: string | null }>(
      `SELECT "platformId" AS platform_id FROM "Account" WHERE "platformId" IS NOT NULL LIMIT 1`
    );
    if (acc?.platform_id) {
      const plat = await queryOne<{ id: string }>(`SELECT id FROM "Platform" WHERE id = $1`, [acc.platform_id]);
      expect(plat?.id).toBe(acc.platform_id);
    }
  });

  test('account currency is a non-empty string', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const acc = await queryOne<{ currency: string }>(`SELECT currency FROM "Account" LIMIT 1`);
    if (acc) {
      expect(acc.currency.length).toBeGreaterThan(0);
    }
  });
});