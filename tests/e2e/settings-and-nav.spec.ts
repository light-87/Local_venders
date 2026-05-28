import { test, expect } from './fixtures';

test.describe('settings + bottom nav', () => {
  test('settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: /settings|more/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('bottom nav links to all five main routes', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const expected = [
      { name: /home/i, url: /\/dashboard/ },
      { name: /reminders/i, url: /\/reminders/ },
      { name: /new sale/i, url: /\/sales\/new/ },
      { name: /money/i, url: /\/transactions/ },
      { name: /more/i, url: /\/settings/ },
    ];

    for (const { name, url } of expected) {
      await page.goto('/dashboard');
      const link = page.locator('nav.fixed.bottom-0').getByRole('link', { name }).first();
      await link.click();
      await page.waitForURL(url, { timeout: 10_000 });
      expect(page.url()).toMatch(url);
    }
  });
});
