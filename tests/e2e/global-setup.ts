import { chromium, type FullConfig } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const AUTH_DIR = path.join(__dirname, '.auth');
const STORAGE = path.join(AUTH_DIR, 'demo.json');

export default async function globalSetup(config: FullConfig) {
  if (process.env.SKIP_GLOBAL_SETUP) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    if (!fs.existsSync(STORAGE)) {
      fs.writeFileSync(STORAGE, JSON.stringify({ cookies: [], origins: [] }));
    }
    return;
  }
  const baseURL = process.env.E2E_BASE_URL || 'https://kuberbook.shop';
  const bypass = process.env.VERCEL_BYPASS_TOKEN!;
  const username = process.env.DEMO_USERNAME || 'demo';
  const pin = process.env.DEMO_PIN || '12345';

  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL,
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': bypass,
      'x-vercel-set-bypass-cookie': 'true',
    },
  });
  const page = await context.newPage();

  await page.goto('/login', { waitUntil: 'networkidle' });

  const switchBtn = page.getByRole('button', { name: /switch/i });
  if (await switchBtn.isVisible().catch(() => false)) {
    await switchBtn.click();
  }

  const usernameInput = page.getByPlaceholder(/enter your username/i);
  if (await usernameInput.isVisible().catch(() => false)) {
    await usernameInput.fill(username);
  }

  const pinField = page.getByPlaceholder(/enter 5-digit pin/i);
  await pinField.fill(pin);

  await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/auth/login'), { timeout: 30_000 }),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);

  await page.waitForURL((url) => /\/(dashboard|admin)/.test(url.pathname), {
    timeout: 30_000,
  });

  await context.storageState({ path: STORAGE });
  await browser.close();
}
