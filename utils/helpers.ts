import { Page, expect } from '@playwright/test';

/**
 * Helpers shared across the test files.
 *
 * - `expectUrlContains` / `waitForUrl`: convenience wrappers used widely
 *   in page objects.
 * - `trackConsoleErrors` / `assertNoConsoleErrors`: fail a test when the
 *   page logged any unexpected client-side errors.
 * - `uniqueEmail` / `uniqueUsername`: timestamped identifiers safe to
 *   use across repeated runs.
 * - `toastContainsText`: wait for a snackbar / toast to appear with
 *   specific text (used by action-confirmation assertions).
 */

export async function expectUrlContains(page: Page, fragment: string): Promise<void> {
  await expect(page).toHaveURL(new RegExp(fragment.replace(/\./g, '\\.')));
}

export async function waitForUrl(page: Page, pattern: RegExp, timeout = 15_000): Promise<void> {
  await page.waitForURL(pattern, { timeout });
}

/**
 * Capture every console message of level "error" so the test can fail on
 * unexpected client-side errors.
 */
export function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  return errors;
}

export async function assertNoConsoleErrors(errors: string[]): Promise<void> {
  // Filter out third-party noise (analytics, payment scripts, etc.) plus
  // expected 401s from the public Ghostfolio demo (the demo loads the SPA
  // as an anonymous visitor, so every authenticated API call fails with
  // 401 — that's the app's intended behaviour, not a bug).
  const appErrors = errors.filter(
    (e) =>
      !e.includes('stripe.com') &&
      !e.includes('favicon') &&
      !e.toLowerCase().includes('net::err_blocked_by_client') &&
      !/Failed to load resource.*status of 401/.test(e)
  );
  expect(appErrors, `Unexpected client-side errors:\n${appErrors.join('\n')}`).toHaveLength(0);
}

/** Generate a timestamped, run-unique email address. */
export function uniqueEmail(prefix = 'qa'): string {
  return `${prefix}+${Date.now()}-${Math.floor(Math.random() * 1e6)}@ghostfolio-test.com`;
}

/** Generate a timestamped, run-unique username (lowercase, alphanumeric). */
export function uniqueUsername(prefix = 'qa'): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

/**
 * Format an ISO-8601 date as YYYY-MM-DD for date-based API/UI fields.
 */
export function isoDate(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Wait for a toast to appear with the given text. */
export async function toastContainsText(page: Page, text: RegExp, timeout = 5_000): Promise<void> {
  await expect(page.locator('mat-snack-bar-container, [role="status"]').filter({ hasText: text })).toBeVisible({
    timeout,
  });
}

/**
 * Retry an async block up to N times while it throws. Used for flaky
 * network calls against the public demo host.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  opts: { attempts?: number; delayMs?: number; description?: string } = {}
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const delayMs = opts.delayMs ?? 1_000;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs * Math.pow(2, i)));
      }
    }
  }
  throw new Error(
    `[retry:${opts.description ?? 'fn'}] failed after ${attempts} attempts: ${
      lastErr instanceof Error ? lastErr.message : String(lastErr)
    }`
  );
}