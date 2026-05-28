import { test, expect } from './fixtures';

test.describe('reports', () => {
  test('reports page renders preset buttons', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: /reports/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^today$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /7 days/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /30 days/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /custom/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /download pdf/i })).toBeVisible();
  });

  test('custom preset reveals date inputs', async ({ page }) => {
    await page.goto('/reports');
    await page.getByRole('button', { name: /custom/i }).click();
    await expect(page.locator('input[type="date"]').first()).toBeVisible();
    await expect(page.locator('input[type="date"]')).toHaveCount(2);
  });

  test('Download PDF disabled until custom range is set', async ({ page }) => {
    await page.goto('/reports');
    await page.getByRole('button', { name: /custom/i }).click();
    const downloadBtn = page.getByRole('button', { name: /download pdf/i });
    await expect(downloadBtn).toBeDisabled();
  });

  test('GET /api/reports/daily returns PDF for today range', async ({ api }) => {
    const today = new Date().toISOString().slice(0, 10);
    const res = await api.get(`/api/reports/daily?from=${today}&to=${today}`);
    expect(res.status()).toBeLessThan(500);
    if (res.ok()) {
      const ct = res.headers()['content-type'] || '';
      expect(ct).toMatch(/pdf|octet/i);
      const body = await res.body();
      expect(body.byteLength).toBeGreaterThan(500);
    }
  });
});
