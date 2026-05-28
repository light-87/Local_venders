import { test, expect } from './fixtures';

test.describe('transactions', () => {
  test('transactions list page loads', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });
});
