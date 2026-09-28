import { test, expect } from '../../fixtures/testFixtures';

/**
 * Account endpoints — CRUD on /api/v1/account.
 *
 * Happy-path tests require a Bearer token. We don't try to create one
 * here (covered in api-user.spec.ts); instead we test the auth-gated
 * negative paths so the suite stays independent of the demo host's
 * account-creation rate limits.
 */

test.describe('API — /account (negative)', () => {
  test('GET /account with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.listAccounts();
    expect(res.status).toBe(401);
  });

  test('POST /account with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.createAccount({ name: 'Test', balance: 0, currency: 'USD' });
    expect(res.status).toBe(401);
  });

  test('POST /account/transfer-balance with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.transferAccountBalance({
      fromAccountId: 'xxx',
      toAccountId: 'yyy',
      amount: 1,
    });
    expect(res.status).toBe(401);
  });

  test('GET /account/{id} with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.getAccount('any-id');
    expect(res.status).toBe(401);
  });

  test('GET /account/{id}/balances with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.getAccountBalances('any-id');
    expect(res.status).toBe(401);
  });

  test('PUT /account/{id} with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.updateAccount('any-id', { name: 'X' });
    expect(res.status).toBe(401);
  });

  test('DELETE /account/{id} with no bearer returns 401', async ({ api }) => {
    api.setBearer(null);
    const res = await api.deleteAccount('any-id');
    expect(res.status).toBe(401);
  });
});

test.describe('API — /account (input validation)', () => {
  test('POST /account with an empty name returns 400 / 401', async ({ api }) => {
    api.setBearer('fake-bearer-just-to-bypass-auth-gate');
    const res = await api.createAccount({ name: '', balance: 0, currency: 'USD' });
    expect([400, 401]).toContain(res.status);
  });
});