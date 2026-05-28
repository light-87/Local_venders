import { test, expect } from './fixtures';

test.describe('sales', () => {
  test('sales list page loads', async ({ page }) => {
    await page.goto('/sales');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: /sales/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('new sale form loads with key controls', async ({ page }) => {
    await page.goto('/sales/new');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByRole('button').first()).toBeVisible();
  });
});
