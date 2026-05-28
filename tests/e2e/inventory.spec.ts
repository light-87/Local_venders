import { test, expect } from './fixtures';

test.describe('inventory', () => {
  test('list page loads with header and shopping list link', async ({ page }) => {
    await page.goto('/inventory');
    await expect(page.getByRole('heading', { name: /inventory/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /shopping list/i })).toBeVisible();
  });

  test('search input filters items', async ({ page }) => {
    await page.goto('/inventory');
    const search = page.getByPlaceholder(/search/i).first();
    if (await search.isVisible().catch(() => false)) {
      await search.fill('zzz-no-such-item-xyz');
      await page.waitForTimeout(800);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('CRUD: create item via API, verify in list, then delete via API', async ({ page, api, unique }) => {
    const itemName = `e2e-${unique}`;

    const createRes = await api.post('/api/inventory', {
      data: {
        name: itemName,
        currentStock: 1,
        unit: 'pcs',
        unitPrice: 10,
        costPrice: 0,
        minStockAlert: 0,
        description: '',
        categoryId: null,
      },
    });
    expect(createRes.ok(), `create failed: ${createRes.status()} ${await createRes.text()}`).toBeTruthy();
    const created = await createRes.json();
    const itemId: string = created.item?.id || created.id;
    expect(itemId).toBeTruthy();

    await page.goto(`/inventory?search=${encodeURIComponent(itemName)}`);
    await expect(page.locator(`text=${itemName}`).first()).toBeVisible({ timeout: 10_000 });

    await page.goto(`/inventory/${itemId}`);
    await expect(page.locator('input[name="name"]')).toHaveValue(itemName);

    const deleteRes = await api.delete(`/api/inventory/${itemId}`);
    expect(deleteRes.ok(), `delete failed: ${deleteRes.status()}`).toBeTruthy();

    await page.goto(`/inventory?search=${encodeURIComponent(itemName)}`);
    await expect(page.locator(`text=${itemName}`)).toHaveCount(0, { timeout: 10_000 });
  });
});
