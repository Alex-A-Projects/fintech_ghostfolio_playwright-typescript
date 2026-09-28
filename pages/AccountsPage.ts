import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * AccountsPage — the post-login accounts list at /en/accounts.
 *
 * Renders a table of all accounts the user owns (Cash, Securities,
 * Cryptocurrency, etc.), each with the current balance, currency,
 * platform and a per-row action menu (Edit / Delete). The page also
 * exposes the "Create Account" CTA in the header.
 */
export class AccountsPage extends BasePage {
  readonly heading: Locator;
  readonly createAccountButton: Locator;
  readonly importButton: Locator;
  readonly accountsTable: Locator;
  readonly accountRows: Locator;
  readonly emptyStateMessage: Locator;
  readonly noAccountsYetMessage: Locator;

  // Row-level controls (operate on the first row when "first" is true)
  readonly accountRowMenu: Locator;
  readonly editAccountButton: Locator;
  readonly deleteAccountButton: Locator;
  readonly transferBalanceButton: Locator;

  // Account creation form
  readonly accountNameInput: Locator;
  readonly accountCurrencySelect: Locator;
  readonly accountBalanceInput: Locator;
  readonly accountPlatformSelect: Locator;
  readonly accountTypeSelect: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  // Balance-transfer dialog
  readonly transferDialog: Locator;
  readonly fromAccountSelect: Locator;
  readonly toAccountSelect: Locator;
  readonly transferAmountInput: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.locator('h1, h2').filter({ hasText: /accounts/i }).first();
    this.createAccountButton = page.locator('a:has-text("Create"), button:has-text("Create Account")').first();
    this.importButton = page.locator('a:has-text("Import"), button:has-text("Import")').first();
    this.accountsTable = page.locator('table, [role="grid"], mat-card').first();
    this.accountRows = page.locator('table tbody tr, [role="row"]');
    this.emptyStateMessage = page.locator('text=/no accounts|no data|empty/i').first();
    this.noAccountsYetMessage = page.locator('text=/create your first/i').first();

    this.accountRowMenu = page.locator('button[aria-label*="menu"], button[aria-haspopup="menu"]').first();
    this.editAccountButton = page.locator('a:has-text("Edit"), button:has-text("Edit")').first();
    this.deleteAccountButton = page.locator('a:has-text("Delete"), button:has-text("Delete")').first();
    this.transferBalanceButton = page.locator('a:has-text("Transfer"), button:has-text("Transfer")').first();

    this.accountNameInput = page.locator('input[name*="name"], input[placeholder*="name" i]').first();
    this.accountCurrencySelect = page.locator('mat-select[name*="currency"], select[name*="currency"]').first();
    this.accountBalanceInput = page.locator('input[name*="balance"], input[type="number"]').first();
    this.accountPlatformSelect = page.locator('mat-select[name*="platform"], select[name*="platform"]').first();
    this.accountTypeSelect = page.locator('mat-select[name*="type"], select[name*="type"]').first();
    this.submitButton = page.locator('button:has-text("Save"), button:has-text("Create"), button[type="submit"]').first();
    this.cancelButton = page.locator('button:has-text("Cancel")').first();

    this.transferDialog = page.locator('mat-dialog-container:has-text("Transfer")').first();
    this.fromAccountSelect = page.locator('mat-select[name*="from"]').first();
    this.toAccountSelect = page.locator('mat-select[name*="to"]').first();
    this.transferAmountInput = page.locator('input[name*="amount"], input[type="number"]').first();
  }

  /** Open the accounts page. */
  async open(): Promise<void> {
    await this.goto('/en/accounts');
    await this.waitForAppReady();
  }

  /** Click the Create Account button. */
  async clickCreateAccount(): Promise<void> {
    await this.createAccountButton.click();
    await this.waitForAppReady();
  }

  /** Number of account rows currently rendered. */
  async getAccountRowCount(): Promise<number> {
    return await this.accountRows.count();
  }

  /** Assert the accounts page rendered (table or empty state visible). */
  async assertLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/accounts/);
    await expect(this.createAccountButton).toBeVisible();
  }
}