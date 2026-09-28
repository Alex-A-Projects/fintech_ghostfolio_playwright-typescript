/**
 * global-setup.ts — runs ONCE before the entire suite.
 *
 * Probes the Ghostfolio public API to make sure the suite has a healthy
 * host to talk to. If the host is down or rate-limiting the probe, tests
 * downstream will self-skip rather than fail noisily.
 */
import { request } from '@playwright/test';
import { BasePage } from './pages/BasePage';

export default async function () {
  const MAX_ATTEMPTS = 5;
  const WAIT_MS = 10_000;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const ctx = await request.newContext();
      const res = await ctx.get(`${BasePage.BASE_URL}/api/v1/health`, {
        timeout: 10_000,
      });
      await ctx.dispose();
      if (res.status() === 200) {
        console.log(`[global-setup] Ghostfolio API is healthy (attempt ${i + 1}/${MAX_ATTEMPTS}).`);
        return;
      }
      console.warn(`[global-setup] Ghostfolio API returned ${res.status()}, attempt ${i + 1}/${MAX_ATTEMPTS}.`);
    } catch (err) {
      console.warn(`[global-setup] Probe failed: ${(err as Error).message}.`);
    }
    if (i < MAX_ATTEMPTS - 1) {
      console.log(`[global-setup] Waiting ${WAIT_MS / 1000}s before next probe…`);
      await new Promise((r) => setTimeout(r, WAIT_MS));
    }
  }
  console.warn(
    `[global-setup] Ghostfolio API still appears unhealthy after ${MAX_ATTEMPTS} probes. Tests will self-skip where appropriate.`
  );
}