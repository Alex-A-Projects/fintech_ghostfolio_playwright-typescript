import { APIRequestContext, request as playwrightRequest } from '@playwright/test';
import { API_BASE_URL } from './testData';

/**
 * Thin typed wrapper around Playwright's APIRequestContext for the
 * Ghostfolio public + authenticated API.
 *
 * Every method returns { status, body } where `body` is the parsed JSON
 * payload (or null on empty responses). The tests assert on the status
 * code + specific body fields, never on raw text.
 *
 * Endpoints covered:
 *   Public:
 *     GET    /api/v1/health
 *     GET    /api/v1/info
 *     GET    /api/v1/symbol/lookup
 *     GET    /api/v1/symbol/{dataSource}/{symbol}
 *     GET    /api/v1/symbol/{dataSource}/{symbol}/{date}
 *     GET    /api/v1/asset/{dataSource}/{symbol}
 *     GET    /api/v1/exchange-rate/{symbol}/{date}
 *     GET    /api/v1/public/{accessId}/portfolio
 *   Auth (Bearer):
 *     POST   /api/v1/auth/anonymous
 *     GET    /api/v1/user
 *     POST   /api/v1/user
 *     PUT    /api/v1/user/setting
 *     POST   /api/v1/user/access-token
 *     DELETE /api/v1/user
 *     GET    /api/v1/account
 *     POST   /api/v1/account
 *     GET    /api/v1/account/{id}
 *     GET    /api/v1/account/{id}/balances
 *     PUT    /api/v1/account/{id}
 *     DELETE /api/v1/account/{id}
 *     POST   /api/v1/account/transfer-balance
 *     GET    /api/v1/activities
 *     GET    /api/v1/activities/{id}
 *     POST   /api/v1/activities
 *     PUT    /api/v1/activities/{id}
 *     DELETE /api/v1/activities/{id}
 *     DELETE /api/v1/activities
 *     GET    /api/v1/portfolio/details
 *     GET    /api/v1/portfolio/holdings
 *     GET    /api/v1/portfolio/performance
 *     GET    /api/v1/portfolio/dividends
 *     GET    /api/v1/portfolio/investments
 *     GET    /api/v1/portfolio/report
 *     GET    /api/v1/portfolio/holding/{dataSource}/{symbol}
 *     PUT    /api/v1/portfolio/holding/{dataSource}/{symbol}/tags
 *     GET    /api/v1/export
 *     POST   /api/v1/import
 *     PATCH  /api/v1/asset-profiles/{dataSource}/{symbol}
 */

export interface ApiResponse<T = unknown> {
  status: number;
  body: T | null;
  headers: Record<string, string>;
}

export class ApiClient {
  readonly baseUrl: string;
  private ctx: APIRequestContext | null = null;
  private bearerToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  }

  /** Lazily create a request context (one per ApiClient instance). */
  private async context(): Promise<APIRequestContext> {
    if (!this.ctx) {
      this.ctx = await playwrightRequest.newContext({
        baseURL: this.baseUrl,
        extraHTTPHeaders: { Accept: 'application/json' },
      });
    }
    return this.ctx;
  }

  /** Override the bearer token used for subsequent authenticated calls. */
  setBearer(token: string | null): void {
    this.bearerToken = token;
  }

  /** Compose the Authorization header when a bearer is set. */
  private authHeaders(): Record<string, string> {
    return this.bearerToken ? { Authorization: `Bearer ${this.bearerToken}` } : {};
  }

  /** Dispose of the underlying context. Call from afterAll(). */
  async dispose(): Promise<void> {
    if (this.ctx) {
      await this.ctx.dispose();
      this.ctx = null;
    }
  }

  // ---------- Generic helpers ----------

  private async send<T>(
    method: string,
    path: string,
    opts: { query?: Record<string, string | number | boolean>; data?: unknown; headers?: Record<string, string> } = {}
  ): Promise<ApiResponse<T>> {
    const ctx = await this.context();
    const headers = { ...this.authHeaders(), ...(opts.headers ?? {}) };
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const res = await ctx.fetch(cleanPath, {
      method,
      headers,
      data: opts.data as never,
      params: opts.query as never,
    });
    const text = await res.text();
    let parsed: T | null = null;
    if (text) {
      try {
        parsed = JSON.parse(text) as T;
      } catch {
        // Non-JSON body — return raw string under `body: null` so callers
        // can still assert on `status`.
      }
    }
    const headersObj: Record<string, string> = {};
    for (const [k, v] of Object.entries(res.headers())) {
      headersObj[k] = String(v);
    }
    return { status: res.status(), body: parsed, headers: headersObj };
  }

  get<T = unknown>(path: string, query?: Record<string, string | number | boolean>): Promise<ApiResponse<T>> {
    return this.send<T>('GET', path, { query });
  }
  post<T = unknown>(path: string, data?: unknown, query?: Record<string, string | number | boolean>): Promise<ApiResponse<T>> {
    return this.send<T>('POST', path, { data, query });
  }
  put<T = unknown>(path: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.send<T>('PUT', path, { data });
  }
  patch<T = unknown>(path: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.send<T>('PATCH', path, { data });
  }
  delete<T = unknown>(path: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.send<T>('DELETE', path, { data });
  }

  // ---------- Public, no-auth endpoints ----------

  /** GET /api/v1/health — returns { status: 'OK' } on success. */
  health(): Promise<ApiResponse<{ status: string }>> {
    return this.get<{ status: string }>('/api/v1/health');
  }

  /** GET /api/v1/info — returns the InfoResponse. */
  info(): Promise<ApiResponse<InfoResponse>> {
    return this.get<InfoResponse>('/api/v1/info');
  }

  /** GET /api/v1/symbol/lookup — search for a symbol. */
  symbolLookup(query: string): Promise<ApiResponse<SymbolLookupResponse>> {
    return this.get<SymbolLookupResponse>('/api/v1/symbol/lookup', { query });
  }

  /** GET /api/v1/symbol/{dataSource}/{symbol} — symbol profile + current quote. */
  symbolProfile(dataSource: string, symbol: string): Promise<ApiResponse<SymbolProfileResponse>> {
    return this.get<SymbolProfileResponse>(`/api/v1/symbol/${dataSource}/${symbol}`);
  }

  /** GET /api/v1/symbol/{dataSource}/{symbol}/{dateString} — historical quote. */
  symbolHistorical(
    dataSource: string,
    symbol: string,
    dateString: string
  ): Promise<ApiResponse<SymbolHistoricalResponse>> {
    return this.get<SymbolHistoricalResponse>(
      `/api/v1/symbol/${dataSource}/${symbol}/${dateString}`
    );
  }

  /** GET /api/v1/asset/{dataSource}/{symbol} — full asset response. */
  asset(dataSource: string, symbol: string): Promise<ApiResponse<AssetResponse>> {
    return this.get<AssetResponse>(`/api/v1/asset/${dataSource}/${symbol}`);
  }

  /** GET /api/v1/exchange-rate/{symbol}/{dateString} — FX rate. */
  exchangeRate(symbol: string, dateString: string): Promise<ApiResponse<ExchangeRateResponse>> {
    return this.get<ExchangeRateResponse>(`/api/v1/exchange-rate/${symbol}/${dateString}`);
  }

  /** GET /api/v1/public/{accessId}/portfolio — read-only public portfolio. */
  publicPortfolio(accessId: string): Promise<ApiResponse<PublicPortfolioResponse>> {
    return this.get<PublicPortfolioResponse>(`/api/v1/public/${accessId}/portfolio`);
  }

  // ---------- Auth ----------

  /** POST /api/v1/auth/anonymous — exchange security token for JWT. */
  authAnonymous(accessToken: string): Promise<ApiResponse<AuthResponse>> {
    return this.post<AuthResponse>('/api/v1/auth/anonymous', { accessToken });
  }

  // ---------- Authenticated endpoints (Bearer) ----------

  userMe(): Promise<ApiResponse<UserResponse>> {
    return this.get<UserResponse>('/api/v1/user');
  }
  createUser(data: { email: string; password: string; role?: string }): Promise<ApiResponse<UserResponse>> {
    return this.post<UserResponse>('/api/v1/user', data);
  }
  deleteUser(): Promise<ApiResponse<unknown>> {
    return this.delete('/api/v1/user');
  }
  rotateOwnAccessToken(): Promise<ApiResponse<{ accessToken: string }>> {
    return this.post<{ accessToken: string }>('/api/v1/user/access-token');
  }
  updateSetting(key: string, value: unknown): Promise<ApiResponse<unknown>> {
    return this.put('/api/v1/user/setting', { key, value });
  }

  listAccounts(): Promise<ApiResponse<AccountResponse[]>> {
    return this.get<AccountResponse[]>('/api/v1/account');
  }
  createAccount(data: CreateAccountPayload): Promise<ApiResponse<AccountResponse>> {
    return this.post<AccountResponse>('/api/v1/account', data);
  }
  getAccount(id: string): Promise<ApiResponse<AccountResponse>> {
    return this.get<AccountResponse>(`/api/v1/account/${id}`);
  }
  getAccountBalances(id: string): Promise<ApiResponse<AccountBalanceResponse>> {
    return this.get<AccountBalanceResponse>(`/api/v1/account/${id}/balances`);
  }
  updateAccount(id: string, data: UpdateAccountPayload): Promise<ApiResponse<AccountResponse>> {
    return this.put<AccountResponse>(`/api/v1/account/${id}`, data);
  }
  deleteAccount(id: string): Promise<ApiResponse<unknown>> {
    return this.delete(`/api/v1/account/${id}`);
  }
  transferAccountBalance(data: TransferBalancePayload): Promise<ApiResponse<unknown>> {
    return this.post('/api/v1/account/transfer-balance', data);
  }

  listActivities(query: ActivityListQuery = {}): Promise<ApiResponse<ActivityResponse[]>> {
    return this.get<ActivityResponse[]>('/api/v1/activities', query as Record<string, string | number | boolean>);
  }
  getActivity(id: string): Promise<ApiResponse<ActivityResponse>> {
    return this.get<ActivityResponse>(`/api/v1/activities/${id}`);
  }
  createActivity(data: CreateActivityPayload): Promise<ApiResponse<ActivityResponse>> {
    return this.post<ActivityResponse>('/api/v1/activities', data);
  }
  updateActivity(id: string, data: Partial<CreateActivityPayload>): Promise<ApiResponse<ActivityResponse>> {
    return this.put<ActivityResponse>(`/api/v1/activities/${id}`, data);
  }
  deleteActivity(id: string): Promise<ApiResponse<unknown>> {
    return this.delete(`/api/v1/activities/${id}`);
  }
  deleteActivities(data: { activityIds: string[] }): Promise<ApiResponse<unknown>> {
    return this.delete('/api/v1/activities', data);
  }

  portfolioDetails(query: PortfolioQuery = {}): Promise<ApiResponse<PortfolioDetailsResponse>> {
    return this.get<PortfolioDetailsResponse>('/api/v1/portfolio/details', query as Record<string, string | number | boolean>);
  }
  portfolioHoldings(query: PortfolioQuery = {}): Promise<ApiResponse<PortfolioHoldingsResponse>> {
    return this.get<PortfolioHoldingsResponse>('/api/v1/portfolio/holdings', query as Record<string, string | number | boolean>);
  }
  portfolioPerformance(query: PortfolioQuery = {}): Promise<ApiResponse<PortfolioPerformanceResponse>> {
    // Ghostfolio versions this endpoint at v2 (see @Version('2') in the
    // portfolio controller). The v1 route returns 404.
    return this.get<PortfolioPerformanceResponse>('/api/v2/portfolio/performance', query as Record<string, string | number | boolean>);
  }
  portfolioDividends(query: PortfolioQuery = {}): Promise<ApiResponse<PortfolioDividendsResponse>> {
    return this.get<PortfolioDividendsResponse>('/api/v1/portfolio/dividends', query as Record<string, string | number | boolean>);
  }
  portfolioInvestments(query: PortfolioQuery = {}): Promise<ApiResponse<PortfolioInvestmentsResponse>> {
    return this.get<PortfolioInvestmentsResponse>('/api/v1/portfolio/investments', query as Record<string, string | number | boolean>);
  }
  portfolioReport(): Promise<ApiResponse<PortfolioReportResponse>> {
    return this.get<PortfolioReportResponse>('/api/v1/portfolio/report');
  }
  portfolioHolding(dataSource: string, symbol: string, query: PortfolioQuery = {}): Promise<ApiResponse<HoldingResponse>> {
    return this.get<HoldingResponse>(`/api/v1/portfolio/holding/${dataSource}/${symbol}`, query as Record<string, string | number | boolean>);
  }
  portfolioHoldingTags(dataSource: string, symbol: string, tags: { tags: { name: string }[] }): Promise<ApiResponse<unknown>> {
    return this.put(`/api/v1/portfolio/holding/${dataSource}/${symbol}/tags`, tags);
  }

  exportPortfolio(): Promise<ApiResponse<ExportResponse>> {
    return this.get<ExportResponse>('/api/v1/export');
  }
  importPortfolio(data: ImportPayload): Promise<ApiResponse<ImportResponse>> {
    return this.post<ImportResponse>('/api/v1/import', data);
  }
  patchAssetProfile(
    dataSource: string,
    symbol: string,
    data: AssetProfilePatchPayload
  ): Promise<ApiResponse<unknown>> {
    return this.patch(`/api/v1/asset-profiles/${dataSource}/${symbol}`, data);
  }
}

// ---------------- Response / payload types ----------------

export interface InfoResponse {
  baseCurrency: string;
  currencies: string[];
  benchmarks: { dataSource: string; id: string; name: string; symbol: string }[];
  countriesOfSubscribers: string[];
  demoAuthToken: string;
  globalPermissions: string[];
  statistics: {
    activeUsers1d: number;
    activeUsers30d: number;
    newUsers30d: number;
    dockerHubPulls: number;
    gitHubContributors: number;
    gitHubStargazers: number;
    slackCommunityUsers: number;
    uptime: number;
  };
  subscriptionOffer?: { price: number; priceId: string; isRenewal: boolean };
  fearAndGreedStocksMarketPrice?: number;
}

export interface SymbolLookupResponse {
  items: { dataSource: string; symbol: string; name: string }[];
}

export interface SymbolProfileResponse {
  dataSource: string;
  symbol: string;
  name?: string;
  currency?: string;
  marketPrice?: number;
  marketPriceCurrency?: string;
  assetClass?: string;
  assetSubClass?: string;
}

export interface SymbolHistoricalResponse {
  marketPrice: number;
  marketPriceCurrency?: string;
  date?: string;
}

export interface AssetResponse {
  assetProfile: {
    dataSource: string;
    symbol: string;
    name: string;
    assetClass?: string;
    assetSubClass?: string;
    countries?: { code: string; weight: number }[];
    holdings?: { name: string; weight: number }[];
    sectors?: { name: string; weight: number }[];
  };
  marketData: unknown[];
  splits: unknown[];
}

export interface ExchangeRateResponse {
  marketPrice: number;
  symbol: string;
  date?: string;
}

export interface PublicPortfolioResponse {
  holdings: unknown[];
  accounts?: unknown[];
}

export interface AuthResponse {
  authToken: string;
}

export interface UserResponse {
  id: string;
  accessToken: string;
  role: 'ADMIN' | 'USER';
  settings?: { key: string; value: unknown }[];
  accounts?: AccountResponse[];
  createdAt?: string;
}

export interface AccountResponse {
  id: string;
  name: string;
  balance: number;
  currency: string;
  isExcluded?: boolean;
  platformId?: string | null;
  accountType?: 'CASH' | 'SECURITIES' | 'CRYPTOCURRENCY' | 'COMMODITY' | 'REAL_ESTATE' | 'LIABILITY' | 'OTHER';
  createdAt?: string;
  updatedAt?: string;
  activities?: unknown[];
}

export interface AccountBalanceResponse {
  balance: number;
  currentValue: number;
  netPerformance: number;
  netPerformancePct: number;
  dividend: number;
}

export interface ActivityResponse {
  id: string;
  accountId: string;
  symbol?: string;
  dataSource?: string;
  date: string;
  quantity: number;
  unitPrice: number;
  fee: number;
  currency: string;
  type: string;
  name?: string;
  comment?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateActivityPayload {
  accountId: string;
  symbol: string;
  dataSource: string;
  date: string;
  quantity: number;
  unitPrice: number;
  fee: number;
  currency: string;
  type: string;
  name?: string;
  comment?: string;
}

export interface CreateAccountPayload {
  name: string;
  balance: number;
  currency: string;
  platformId?: string | null;
  accountType?: AccountResponse['accountType'];
  isExcluded?: boolean;
}

export interface UpdateAccountPayload {
  name?: string;
  balance?: number;
  currency?: string;
  platformId?: string | null;
  accountType?: AccountResponse['accountType'];
  isExcluded?: boolean;
}

export interface TransferBalancePayload {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency?: string;
}

export interface PortfolioDetailsResponse {
  holdings: { symbol: string; name: string; currency: string; allocationInPercentage: number }[];
  accounts: { id: string; name: string; balance: number; currency: string }[];
}

export interface PortfolioHoldingsResponse {
  holdings: HoldingResponse[];
}

export interface HoldingResponse {
  symbol: string;
  name: string;
  dataSource: string;
  currency: string;
  allocationInPercentage: number;
  marketPrice?: number;
  quantity?: number;
  valueInBaseCurrency?: number;
  performancePct?: number;
}

export interface PortfolioPerformanceResponse {
  performance: { currentValueInBaseCurrency: number; netPerformance: number; netPerformancePercentage: number; totalInvestment: number };
  chart: { date: string; value: number }[];
}

export interface PortfolioDividendsResponse {
  dividends: { symbol: string; name: string; date: string; amount: number; currency: string }[];
}

export interface PortfolioInvestmentsResponse {
  investments: { symbol: string; name: string; date: string; value: number; currency: string }[];
}

export interface PortfolioReportResponse {
  report: unknown;
}

export interface PortfolioQuery {
  accounts?: string;
  symbol?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  range?: string;
}

export interface ActivityListQuery {
  accounts?: string;
  symbol?: string;
  dataSource?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExportResponse {
  meta: { dateFormat: string; version: string };
  activities: ActivityResponse[];
  accounts: AccountResponse[];
}

export interface ImportPayload {
  activities: CreateActivityPayload[];
}

export interface ImportResponse {
  activities: { id: string; symbol: string }[];
}

export interface AssetProfilePatchPayload {
  countries?: { code: string; weight: number }[];
  holdings?: { name: string; weight: number }[];
  sectors?: { name: string; weight: number }[];
}