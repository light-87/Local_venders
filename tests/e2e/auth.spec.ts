import { test, expect } from './fixtures';

test.describe('auth', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('valid demo credentials redirect to /dashboard', async ({ page }) => {
    const username = process.env.DEMO_USERNAME || 'demo';
    const pin = process.env.DEMO_PIN || '12345';

    await page.goto('/login');

    const switchBtn = page.getByRole('button', { name: /switch/i });
    if (await switchBtn.isVisible().catch(() => false)) {
      await switchBtn.click();
    }

    await page.getByPlaceholder(/enter your username/i).fill(username);
    await page.getByPlaceholder(/enter 5-digit pin/i).fill(pin);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL(/\/(dashboard|admin)/, { timeout: 30_000 });
    expect(page.url()).toMatch(/\/(dashboard|admin)/);
  });

  test('wrong PIN shows error and stays on /login', async ({ page }) => {
    const username = process.env.DEMO_USERNAME || 'demo';

    await page.goto('/login');

    const switchBtn = page.getByRole('button', { name: /switch/i });
    if (await switchBtn.isVisible().catch(() => false)) {
      await switchBtn.click();
    }

    await page.getByPlaceholder(/enter your username/i).fill(username);
    await page.getByPlaceholder(/enter 5-digit pin/i).fill('00000');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.locator('text=/invalid|incorrect|failed|wrong/i').first()).toBeVisible({
      timeout: 10_000,
    });
    expect(page.url()).toContain('/login');
  });

  test('PIN shorter than 5 digits is rejected client-side', async ({ page }) => {
    await page.goto('/login');

    const switchBtn = page.getByRole('button', { name: /switch/i });
    if (await switchBtn.isVisible().catch(() => false)) {
      await switchBtn.click();
    }

    await page.getByPlaceholder(/enter your username/i).fill(process.env.DEMO_USERNAME || 'demo');
    await page.getByPlaceholder(/enter 5-digit pin/i).fill('12');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.locator('text=/5 digits|must be 5/i').first()).toBeVisible({
      timeout: 5_000,
    });
    expect(page.url()).toContain('/login');
  });
});
