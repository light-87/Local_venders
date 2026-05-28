import { test, expect } from './fixtures';

test.describe('customers', () => {
  test('customers list loads', async ({ page }) => {
    await page.goto('/customers');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: /customer/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('balances page loads', async ({ page }) => {
    await page.goto('/balances');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });
});
