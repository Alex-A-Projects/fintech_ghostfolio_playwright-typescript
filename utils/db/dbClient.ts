import { Pool, PoolClient, QueryResultRow } from 'pg';

/**
 * Thin typed wrapper around node-postgres for the Ghostfolio PostgreSQL DB.
 *
 * Ghostfolio uses Prisma against PostgreSQL. The Prisma schema declares
 * (relevant subset — current main branch):
 *
 *   User              (id, accessToken, role, provider, thirdPartyId, …)
 *   Account           (id, userId, name, currency, platformId, comment, …)
 *   Platform          (id, name, url)
 *   Order             (id, accountId, accountUserId, symbolProfileId, userId,
 *                      currency, date, quantity, unitPrice, fee, type,
 *                      comment, …)
 *   SymbolProfile     (id, dataSource, symbol, currency, name, assetClass,
 *                      assetSubClass, countries, holdings, sectors, …)
 *   Settings          (userId PK, settings jsonb, updatedAt)
 *   Tag               (id, userId, name)
 *
 * NOTE: the schema has evolved over time — `Activity` was renamed to
 * `Order`, `Setting` was renamed to `Settings` (with a single JSON
 * column), and `Account` no longer carries `balance` / `accountType`
 * (those live elsewhere now). The helpers below match the current
 * schema.
 *
 * Connection settings come from GHOSTFOLIO_DB_URL or fall back to a
 * local Docker-style default.
 */

const DEFAULT_URL =
  process.env.GHOSTFOLIO_DB_URL ??
  // Sensible default that matches the IMIS test container commonly
  // running on workstations configured for QA. Override with the
  // GHOSTFOLIO_DB_URL env var or a .env file at the project root.
  'postgresql://IMISuser:IMISuser@1234@localhost:5432/ghostfolio';

export const DEFAULT_DATABASE_URL = DEFAULT_URL;

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: DEFAULT_URL, max: 10 });
  }
  return pool;
}

/** Dispose of the underlying pool. Call from a global teardown if needed. */
export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/** Execute a parameterized query against the DB. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<T[]> {
  const res = await getPool().query<T>(text, values);
  return res.rows;
}

/** Execute a parameterized query and return a single row (or null). */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, values);
  return rows[0] ?? null;
}

/** Execute a query inside a transaction. The callback receives a client. */
export async function withTransaction<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}

// ---------------- Types ----------------

export interface UserRow {
  id: string;
  access_token: string | null;
  role: 'ADMIN' | 'USER' | 'DEMO';
  provider: string;
  third_party_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface AccountRow {
  id: string;
  user_id: string;
  name: string;
  currency: string;
  platform_id: string | null;
  comment: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderRow {
  id: string;
  account_id: string | null;
  account_user_id: string | null;
  symbol_profile_id: string;
  currency: string;
  date: Date;
  quantity: number;
  unit_price: number;
  fee: number;
  type: string;
  comment: string | null;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface PlatformRow {
  id: string;
  name: string;
  url: string;
}

export interface SymbolProfileRow {
  id: string;
  data_source: string;
  symbol: string;
  currency: string;
  name: string | null;
  asset_class: string | null;
  asset_sub_class: string | null;
  is_active: boolean;
}

export interface SettingsRow {
  user_id: string;
  settings: Record<string, unknown>;
  updated_at: Date;
}

export interface TagRow {
  id: string;
  user_id: string;
  name: string;
}

// ---------------- User ----------------

export async function getUserByAccessToken(token: string): Promise<UserRow | null> {
  return queryOne<UserRow>(
    `SELECT id, "accessToken" AS access_token, role::text AS role, provider::text AS provider,
            "thirdPartyId" AS third_party_id,
            "createdAt" AS created_at, "updatedAt" AS updated_at
     FROM "User" WHERE "accessToken" = $1 LIMIT 1`,
    [token]
  );
}

export async function getUserById(id: string): Promise<UserRow | null> {
  return queryOne<UserRow>(
    `SELECT id, "accessToken" AS access_token, role::text AS role, provider::text AS provider,
            "thirdPartyId" AS third_party_id,
            "createdAt" AS created_at, "updatedAt" AS updated_at
     FROM "User" WHERE id = $1 LIMIT 1`,
    [id]
  );
}

export async function userCount(): Promise<number> {
  const row = await queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM "User"`);
  return Number(row?.count ?? 0);
}

export async function userExistsByAccessToken(token: string): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM "User" WHERE "accessToken" = $1) AS exists`,
    [token]
  );
  return Boolean(row?.exists);
}

export async function deleteUserById(id: string): Promise<number> {
  const rows = await query<{ id: string }>(`DELETE FROM "User" WHERE id = $1 RETURNING id`, [id]);
  return rows.length;
}

/** Insert a fresh User row. Returns the new id. */
export async function insertUser(opts: {
  id: string;
  accessToken?: string | null;
  role?: 'ADMIN' | 'USER';
  provider?: string;
}): Promise<string> {
  await query(
    `INSERT INTO "User" (id, "accessToken", role, provider, "createdAt", "updatedAt")
     VALUES ($1, $2, $3::"Role", $4::"Provider", NOW(), NOW())
     ON CONFLICT (id) DO NOTHING`,
    [opts.id, opts.accessToken ?? null, opts.role ?? 'USER', opts.provider ?? 'ANONYMOUS']
  );
  return opts.id;
}

// ---------------- Account ----------------

export async function getAccountById(id: string): Promise<AccountRow | null> {
  return queryOne<AccountRow>(
    `SELECT id, "userId" AS user_id, name, currency, "platformId" AS platform_id,
            comment, "createdAt" AS created_at, "updatedAt" AS updated_at
     FROM "Account" WHERE id = $1 LIMIT 1`,
    [id]
  );
}

export async function getAccountsByUser(userId: string): Promise<AccountRow[]> {
  return query<AccountRow>(
    `SELECT id, "userId" AS user_id, name, currency, "platformId" AS platform_id,
            comment, "createdAt" AS created_at, "updatedAt" AS updated_at
     FROM "Account" WHERE "userId" = $1 ORDER BY "createdAt"`,
    [userId]
  );
}

export async function accountCountForUser(userId: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM "Account" WHERE "userId" = $1`,
    [userId]
  );
  return Number(row?.count ?? 0);
}

/**
 * Insert a fresh Account row.
 *
 * Note: Ghostfolio's current schema no longer carries a `balance` column
 * on Account — balance is computed from Orders. Older versions did have
 * a balance column, so this helper intentionally omits it.
 */
export async function insertAccount(opts: {
  id: string;
  userId: string;
  name: string;
  currency: string;
  platformId?: string | null;
}): Promise<string> {
  await query(
    `INSERT INTO "Account" (id, "userId", name, currency, "platformId", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     ON CONFLICT (id, "userId") DO NOTHING`,
    [opts.id, opts.userId, opts.name, opts.currency, opts.platformId ?? null]
  );
  return opts.id;
}

// ---------------- Order (was Activity) ----------------

export async function getOrderById(id: string): Promise<OrderRow | null> {
  return queryOne<OrderRow>(
    `SELECT id, "accountId" AS account_id, "accountUserId" AS account_user_id,
            "symbolProfileId" AS symbol_profile_id, currency, date,
            quantity::float8 AS quantity, "unitPrice"::float8 AS unit_price,
            fee::float8 AS fee, type::text AS type, comment,
            "userId" AS user_id, "createdAt" AS created_at, "updatedAt" AS updated_at
     FROM "Order" WHERE id = $1 LIMIT 1`,
    [id]
  );
}

export async function getOrdersByAccount(accountId: string): Promise<OrderRow[]> {
  return query<OrderRow>(
    `SELECT id, "accountId" AS account_id, "accountUserId" AS account_user_id,
            "symbolProfileId" AS symbol_profile_id, currency, date,
            quantity::float8 AS quantity, "unitPrice"::float8 AS unit_price,
            fee::float8 AS fee, type::text AS type, comment,
            "userId" AS user_id, "createdAt" AS created_at, "updatedAt" AS updated_at
     FROM "Order" WHERE "accountId" = $1 ORDER BY date`,
    [accountId]
  );
}

export async function getOrdersByUser(userId: string): Promise<OrderRow[]> {
  return query<OrderRow>(
    `SELECT id, "accountId" AS account_id, "accountUserId" AS account_user_id,
            "symbolProfileId" AS symbol_profile_id, currency, date,
            quantity::float8 AS quantity, "unitPrice"::float8 AS unit_price,
            fee::float8 AS fee, type::text AS type, comment,
            "userId" AS user_id, "createdAt" AS created_at, "updatedAt" AS updated_at
     FROM "Order" WHERE "userId" = $1 ORDER BY date`,
    [userId]
  );
}

export async function orderCountForAccount(accountId: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM "Order" WHERE "accountId" = $1`,
    [accountId]
  );
  return Number(row?.count ?? 0);
}

export async function orderCountByType(accountId: string, type: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM "Order" WHERE "accountId" = $1 AND type = $2::"Type"`,
    [accountId, type]
  );
  return Number(row?.count ?? 0);
}

export async function orderExistsForAccount(accountId: string, symbol: string, type: string): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(
       SELECT 1 FROM "Order" o
       JOIN "SymbolProfile" sp ON sp.id = o."symbolProfileId"
       WHERE o."accountId" = $1 AND sp.symbol = $2 AND o.type = $3::"Type"
     ) AS exists`,
    [accountId, symbol, type]
  );
  return Boolean(row?.exists);
}

/**
 * Backwards-compat alias. Older schema called this table `Activity`;
 * it was renamed to `Order` in the current schema. Keep the old
 * function name available so callers don't have to update.
 */
export const getActivityById = getOrderById;
export const getActivitiesByAccount = getOrdersByAccount;
export const getActivitiesByUser = getOrdersByUser;
export const activityCountForAccount = orderCountForAccount;
export const activityCountByType = orderCountByType;
export const activityExistsForAccount = orderExistsForAccount;

// ---------------- Platform ----------------

export async function getPlatformById(id: string): Promise<PlatformRow | null> {
  return queryOne<PlatformRow>(`SELECT id, name, url FROM "Platform" WHERE id = $1 LIMIT 1`, [id]);
}

export async function getPlatformByName(name: string): Promise<PlatformRow | null> {
  return queryOne<PlatformRow>(`SELECT id, name, url FROM "Platform" WHERE name = $1 LIMIT 1`, [name]);
}

export async function platformCount(): Promise<number> {
  const row = await queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM "Platform"`);
  return Number(row?.count ?? 0);
}

// ---------------- SymbolProfile ----------------

export async function getSymbolProfile(dataSource: string, symbol: string): Promise<SymbolProfileRow | null> {
  return queryOne<SymbolProfileRow>(
    `SELECT id, "dataSource"::text AS data_source, symbol, currency, name,
            "assetClass"::text AS asset_class, "assetSubClass"::text AS asset_sub_class,
            "isActive" AS is_active
     FROM "SymbolProfile"
     WHERE "dataSource" = $1::"DataSource" AND symbol = $2
     LIMIT 1`,
    [dataSource, symbol]
  );
}

export async function symbolProfileExists(dataSource: string, symbol: string): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM "SymbolProfile" WHERE "dataSource" = $1::"DataSource" AND symbol = $2) AS exists`,
    [dataSource, symbol]
  );
  return Boolean(row?.exists);
}

// ---------------- Settings ----------------

export async function getSettings(userId: string): Promise<SettingsRow | null> {
  return queryOne<SettingsRow>(
    `SELECT "userId" AS user_id, settings, "updatedAt" AS updated_at
     FROM "Settings" WHERE "userId" = $1 LIMIT 1`,
    [userId]
  );
}

/**
 * Convenience: pull a single value out of the user's settings jsonb blob.
 * Returns undefined if the key isn't set.
 */
export async function getSettingValue(userId: string, key: string): Promise<unknown> {
  const row = await queryOne<{ value: unknown }>(
    `SELECT settings->$2 AS value FROM "Settings" WHERE "userId" = $1 LIMIT 1`,
    [userId, key]
  );
  return row?.value;
}

/**
 * Upsert the user's settings row, merging the supplied keys into the
 * existing JSON blob.
 */
export async function upsertSetting(
  userId: string,
  key: string,
  value: unknown
): Promise<void> {
  // Cast $2 to text so pg can infer the parameter type (otherwise
  // jsonb_build_object complains "could not determine data type").
  await query(
    `INSERT INTO "Settings" ("userId", settings, "updatedAt")
     VALUES ($1, jsonb_build_object($2::text, $3::jsonb), NOW())
     ON CONFLICT ("userId") DO UPDATE
       SET settings = "Settings".settings || jsonb_build_object($2::text, $3::jsonb),
           "updatedAt" = NOW()`,
    [userId, key, JSON.stringify(value)]
  );
}

// ---------------- Tag ----------------

export async function getTagsForUser(userId: string): Promise<TagRow[]> {
  return query<TagRow>(`SELECT id, "userId" AS user_id, name FROM "Tag" WHERE "userId" = $1`, [userId]);
}

export async function tagExistsForUser(userId: string, name: string): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM "Tag" WHERE "userId" = $1 AND name = $2) AS exists`,
    [userId, name]
  );
  return Boolean(row?.exists);
}

// ---------------- Schema sanity helpers ----------------

/** Returns true if the Ghostfolio schema exists (User table is present). */
export async function schemaExists(): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'User') AS exists`
  );
  return Boolean(row?.exists);
}

/** List all tables in the current schema — useful for schema-introspection tests. */
export async function listTables(): Promise<{ table_name: string }[]> {
  return query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
  );
}

/** Number of rows in a given table. Useful for cross-checking counts. */
export async function rowCount(tableName: string): Promise<number> {
  // Validate the table name to avoid SQL injection — only allow letters,
  // numbers, underscores and the specific table names we expect.
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM "${tableName}"`
  );
  return Number(row?.count ?? 0);
}

// ---------------- Convenience helpers for the integration suite ----------------

/**
 * Connect and run a smoke-test query. Returns true on success.
 */
export async function ping(): Promise<boolean> {
  try {
    await queryOne(`SELECT 1 AS ok`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Hard-reset the demo user (and only the demo user) by deleting them via
 * Prisma cascade. Useful between integration tests so the demo state
 * doesn't accumulate cruft. NO-OPs if the demo user doesn't exist.
 *
 * The demo user's access token comes from /api/v1/info.
 */
export async function resetDemoUser(accessToken: string): Promise<void> {
  await query(`DELETE FROM "User" WHERE "accessToken" = $1`, [accessToken]);
}