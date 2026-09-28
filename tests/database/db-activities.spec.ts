import { test, expect } from '@playwright/test';
import {
  ping,
  getActivityById,
  getActivitiesByAccount,
  getActivitiesByUser,
  activityCountForAccount,
  activityCountByType,
  activityExistsForAccount,
  queryOne,
} from '../../utils/db/dbClient';

/**
 * DB — Activity table.
 *
 * Verifies that activities are queryable by id / account / user and
 * that the type column accepts the documented enum values.
 */

let dbReachable = false;

test.beforeAll(async () => {
  dbReachable = await ping();
  if (!dbReachable) {
    console.warn('[db-activities] PostgreSQL not reachable — activity tests will be skipped.');
  }
});

test.describe('DB — Activity table', () => {
  test('getActivityById returns null for an unknown id', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const a = await getActivityById('00000000-0000-0000-0000-000000000000');
    expect(a).toBeNull();
  });

  test('activityCountForAccount returns 0 for an unknown account', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const count = await activityCountForAccount('00000000-0000-0000-0000-000000000000');
    expect(count).toBe(0);
  });

  test('activityCountByType returns 0 for an unknown account + type', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const count = await activityCountByType('00000000-0000-0000-0000-000000000000', 'BUY');
    expect(count).toBe(0);
  });

  test('activityExistsForAccount returns false for an unknown account + symbol + type', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const exists = await activityExistsForAccount(
      '00000000-0000-0000-0000-000000000000',
      'AAPL',
      'BUY'
    );
    expect(exists).toBe(false);
  });

  test('the type column uses one of the documented enums', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    // The current schema renamed Activity → Order. The `Type` enum values
    // are unchanged.
    const row = await queryOne<{ type: string }>(
      `SELECT type::text AS type FROM "Order" LIMIT 1`
    );
    if (row) {
      expect(row.type).toMatch(/^(BUY|SELL|DIVIDEND|FEE|INTEREST|LIABILITY)$/);
    }
  });

  test('getActivitiesByAccount returns a stable count', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const acc = await queryOne<{ id: string }>(`SELECT id FROM "Account" LIMIT 1`);
    if (!acc) {
      test.skip();
      return;
    }
    const activities = await getActivitiesByAccount(acc.id);
    const count = await activityCountForAccount(acc.id);
    expect(activities.length).toBe(count);
  });

  test('each activity has the expected shape', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const acc = await queryOne<{ id: string }>(`SELECT id FROM "Account" LIMIT 1`);
    if (!acc) {
      test.skip();
      return;
    }
    const activities = await getActivitiesByAccount(acc.id);
    for (const a of activities.slice(0, 3)) {
      expect(a.id).toBeTruthy();
      expect(a.account_id).toBe(acc.id);
      expect(a.currency).toBeTruthy();
      expect(a.date).toBeTruthy();
      expect(typeof a.quantity).toBe('string');
      expect(typeof a.unit_price).toBe('string');
      expect(typeof a.fee).toBe('string');
      expect(a.type).toMatch(/^(BUY|SELL|DIVIDEND|FEE|INTEREST|LIABILITY)$/);
    }
  });

  test('order quantity / unitPrice / fee are numeric (double precision)', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    // The current schema uses double precision for these — they're JS
    // numbers, not strings.
    const a = await queryOne<{ quantity: number; unit_price: number; fee: number }>(
      `SELECT quantity::float8 AS quantity, "unitPrice"::float8 AS unit_price, fee::float8 AS fee FROM "Order" LIMIT 1`
    );
    if (!a) {
      test.skip();
      return;
    }
    expect(Number.isFinite(a.quantity)).toBe(true);
    expect(Number.isFinite(a.unit_price)).toBe(true);
    expect(Number.isFinite(a.fee)).toBe(true);
  });
});