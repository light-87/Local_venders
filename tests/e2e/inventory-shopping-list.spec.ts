import { test, expect } from './fixtures';

test.describe('shopping list', () => {
  test('renders page and shows low-stock content or empty state', async ({ page }) => {
    await page.goto('/inventory/shopping-list');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: /shopping list|reorder|stock/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('WhatsApp share link (if present) is wa.me URL', async ({ page }) => {
    await page.goto('/inventory/shopping-list');
    await page.waitForLoadState('domcontentloaded');

    const waLink = page.locator('a[href*="wa.me"]').first();
    const visible = await waLink.isVisible().catch(() => false);
    if (visible) {
      const href = await waLink.getAttribute('href');
      expect(href).toMatch(/^https:\/\/wa\.me\//);
    }
  });
});
