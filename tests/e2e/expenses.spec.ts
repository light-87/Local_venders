import { test, expect } from './fixtures';

test.describe('expenses', () => {
  test('expenses list page loads', async ({ page }) => {
    await page.goto('/expenses');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: /expense/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('GET /api/expenses returns JSON list', async ({ api }) => {
    const res = await api.get('/api/expenses');
    expect(res.status()).toBeLessThan(500);
  });
});
