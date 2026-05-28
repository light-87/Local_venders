import { test, expect } from './fixtures';

test.describe('inventory display (TV view)', () => {
  test('renders display screen, bottom nav is hidden', async ({ page }) => {
    await page.goto('/inventory/display');
    await page.waitForLoadState('domcontentloaded');

    const nav = page.locator('nav.fixed.bottom-0');
    await expect(nav).toHaveCount(0);

    await expect(page.locator('body')).toBeVisible();
  });
});
