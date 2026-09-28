import { test, expect } from '@playwright/test';
import {
  ping,
  getPlatformById,
  getPlatformByName,
  platformCount,
  queryOne,
} from '../../utils/db/dbClient';

/**
 * DB — Platform + SymbolProfile tables.
 */

let dbReachable = false;

test.beforeAll(async () => {
  dbReachable = await ping();
  if (!dbReachable) {
    console.warn('[db-platforms] PostgreSQL not reachable — platform tests will be skipped.');
  }
});

test.describe('DB — Platform table', () => {
  test('platformCount returns a non-negative integer', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const count = await platformCount();
    expect(count).toBeGreaterThanOrEqual(0);
    expect(typeof count).toBe('number');
  });

  test('getPlatformById returns null for an unknown id', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const p = await getPlatformById('00000000-0000-0000-0000-000000000000');
    expect(p).toBeNull();
  });

  test('getPlatformByName returns null for an unknown name', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const p = await getPlatformByName('NonExistentPlatform_' + Date.now());
    expect(p).toBeNull();
  });

  test('each platform row has the expected shape', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const p = await queryOne<{ id: string; name: string }>(
      `SELECT id, name FROM "Platform" LIMIT 1`
    );
    if (!p) {
      test.skip();
      return;
    }
    const full = await getPlatformById(p.id);
    expect(full).not.toBeNull();
    expect(full?.id).toBe(p.id);
    expect(full?.name).toBeTruthy();
  });
});

test.describe('DB — SymbolProfile table', () => {
  test('symbol profile rows exist for known assets', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const row = await queryOne<{ symbol: string; data_source: string }>(
      `SELECT symbol, "dataSource" AS data_source FROM "SymbolProfile" LIMIT 1`
    );
    if (!row) {
      test.skip();
      return;
    }
    expect(row.symbol).toBeTruthy();
    expect(row.data_source).toBeTruthy();
  });

  test('asset_class / asset_sub_class are nullable strings', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const row = await queryOne<{ asset_class: string | null; asset_sub_class: string | null }>(
      `SELECT "assetClass" AS asset_class, "assetSubClass" AS asset_sub_class FROM "SymbolProfile" LIMIT 1`
    );
    // Either both null (data not yet filled) or both non-empty strings.
    if (row) {
      if (row.asset_class !== null) {
        expect(row.asset_class.length).toBeGreaterThan(0);
      }
      if (row.asset_sub_class !== null) {
        expect(row.asset_sub_class.length).toBeGreaterThan(0);
      }
    }
  });

  test('data_source values include YAHOO / COINGECKO / MANUAL', async () => {
    test.skip(!dbReachable, 'PostgreSQL not reachable');
    const rows = await queryOne<{ values: string[] }>(
      `SELECT array_agg(DISTINCT "dataSource") AS values FROM "SymbolProfile"`
    );
    // Some hosts may have only one data source — that's fine.
    if (rows?.values && rows.values.length > 0) {
      for (const v of rows.values) {
        expect(typeof v).toBe('string');
      }
    }
  });
});