import { test, expect } from '@playwright/test';
import {
  ping,
  schemaExists,
  listTables,
  rowCount,
  userCount,
  platformCount,
} from '../../utils/db/dbClient';

/**
 * DB — schema introspection.
 *
 * Verifies the Ghostfolio PostgreSQL schema is present and that the
 * core tables (User, Account, Activity, Platform, SymbolProfile)
 * exist. These tests skip themselves if the DB is unreachable so the
 * suite can still run against the public demo host without a local
 * PostgreSQL.
 */

let dbReachable = false;

test.beforeAll(async () => {
  dbReachable = await ping();
  if (!dbReachable) {
    console.warn('[db-schema] PostgreSQL not reachable — schema tests will be skipped.');
  }
});

test.describe('DB — schema introspection', () => {
  test('PostgreSQL is reachable', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    expect(await ping()).toBe(true);
  });

  test('the Ghostfolio schema exists (User table present)', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    expect(await schemaExists()).toBe(true);
  });

  test('expected core tables are present', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const tables = await listTables();
    const names = tables.map((t) => t.table_name);

    // Core Prisma tables — match the current schema. Note that
    // `Activity` was renamed to `Order` and `Setting` to `Settings`.
    const required = ['User', 'Account', 'Order', 'Platform', 'SymbolProfile', 'Settings'];
    for (const t of required) {
      expect(names).toContain(t);
    }
  });

  test('the User table is queryable (count)', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const count = await userCount();
    expect(count).toBeGreaterThanOrEqual(0);
    expect(typeof count).toBe('number');
  });

  test('the Platform table is queryable (count)', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const count = await platformCount();
    expect(count).toBeGreaterThanOrEqual(0);
    expect(typeof count).toBe('number');
  });

  test('rowCount helper validates table names (rejects SQL injection)', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    await expect(rowCount('User; DROP TABLE "User"; --')).rejects.toThrow(/Invalid table name/);
  });

  test('rowCount returns the number of rows in a known table', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const count = await rowCount('User');
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('rowCount rejects empty table names', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    await expect(rowCount('')).rejects.toThrow();
  });
});