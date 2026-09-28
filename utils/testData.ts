/**
 * Shared test data for the Ghostfolio suite.
 *
 * Public Ghostfolio uses JWT-style access tokens per account. The public
 * demo exposes a long-lived `demoAuthToken` via the /api/v1/info endpoint
 * which we can use to log in as the demo user. For brand-new account
 * creation we generate timestamped credentials so concurrent / repeat
 * runs never collide.
 */

/** Base URL for the Ghostfolio API. Overridable via GHOSTFOLIO_API_BASE_URL. */
export const API_BASE_URL = process.env.GHOSTFOLIO_API_BASE_URL ?? 'https://ghostfol.io';

/** Base URL for the Ghostfolio web app. Overridable via GHOSTFOLIO_WEB_BASE_URL. */
export const WEB_BASE_URL = process.env.GHOSTFOLIO_WEB_BASE_URL ?? 'https://ghostfol.io';

/**
 * Activity type enum — match the values the Ghostfolio backend accepts.
 * @see https://github.com/ghostfolio/ghostfolio/blob/main/libs/common/src/lib/types.ts
 */
export const ActivityType = {
  BUY: 'BUY',
  DIVIDEND: 'DIVIDEND',
  FEE: 'FEE',
  INTEREST: 'INTEREST',
  LIABILITY: 'LIABILITY',
  SELL: 'SELL',
} as const;

/** Data source enum — match the values the Ghostfolio backend accepts. */
export const DataSource = {
  COINGECKO: 'COINGECKO',
  GHOSTFOLIO: 'GHOSTFOLIO',
  MANUAL: 'MANUAL',
  YAHOO: 'YAHOO',
} as const;

/** Currencies the demo backend knows about (subset for fast assertions). */
export const CommonCurrencies = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CNY'] as const;

/** Account classification — match the Ghostfolio Account class enum. */
export const AccountClass = {
  CASH: 'CASH',
  SECURITIES: 'SECURITIES',
  CRYPTOCURRENCY: 'CRYPTOCURRENCY',
  COMMODITY: 'COMMODITY',
  REAL_ESTATE: 'REAL_ESTATE',
  LIABILITY: 'LIABILITY',
  OTHER: 'OTHER',
} as const;

/**
 * The public demo's read-only portfolio is exposed without auth at
 * `/api/v1/public/<accessId>/portfolio`. The demo auth token (obtained
 * from /api/v1/info) is also the access id — handy for smoke tests.
 */
export interface DemoCredentials {
  accessToken: string;
}

/**
 * Standard money activity fixture used by API + DB tests.
 */
export interface ActivityFixture {
  accountId?: string;
  currency: string;
  dataSource: typeof DataSource[keyof typeof DataSource];
  date: string;
  fee: number;
  name?: string;
  quantity: number;
  symbol: string;
  type: typeof ActivityType[keyof typeof ActivityType];
  unitPrice: number;
}

/** Build a fresh BUY activity fixture. */
export function buyActivity(opts: Partial<ActivityFixture> = {}): ActivityFixture {
  return {
    currency: 'USD',
    dataSource: DataSource.YAHOO,
    date: new Date().toISOString().slice(0, 10),
    fee: 0,
    quantity: 1,
    symbol: 'AAPL',
    type: ActivityType.BUY,
    unitPrice: 100,
    ...opts,
  };
}

/** Build a fresh dividend activity fixture. */
export function dividendActivity(opts: Partial<ActivityFixture> = {}): ActivityFixture {
  return {
    currency: 'USD',
    dataSource: DataSource.YAHOO,
    date: new Date().toISOString().slice(0, 10),
    fee: 0,
    quantity: 1,
    symbol: 'AAPL',
    type: ActivityType.DIVIDEND,
    unitPrice: 0.5,
    ...opts,
  };
}

/** Standard user payload used by registration / DB tests. */
export interface UserFixture {
  email: string;
  password: string;
  role?: 'ADMIN' | 'USER';
}

/** Build a fresh user with a unique email so repeat runs don't collide. */
export function freshUser(prefix = 'qa'): UserFixture {
  const now = Date.now();
  const rand = Math.floor(Math.random() * 1e6);
  return {
    email: `${prefix}+${now}-${rand}@ghostfolio-test.com`,
    password: 'Passw0rd!Test123',
    role: 'USER',
  };
}