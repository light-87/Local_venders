import { test, expect } from './fixtures';

test.describe('dashboard', () => {
  test('renders Kuberbook home with navigation cards', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('link', { name: /inventory/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /customers/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /sales/i }).first()).toBeVisible();
  });

  test('inventory card navigates to /inventory', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: /inventory/i }).first().click();
    await page.waitForURL(/\/inventory(\?|$|\/)/);
    expect(page.url()).toMatch(/\/inventory/);
  });
});
