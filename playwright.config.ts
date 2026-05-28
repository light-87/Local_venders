import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: path.resolve(process.cwd(), '.env.test') });

const baseURL = process.env.E2E_BASE_URL || 'https://kuberbook.shop';
const bypass = process.env.VERCEL_BYPASS_TOKEN;

if (!bypass) {
  throw new Error(
    'VERCEL_BYPASS_TOKEN missing. Create .env.test with VERCEL_BYPASS_TOKEN, DEMO_USERNAME, DEMO_PIN.'
  );
}

const extraHTTPHeaders: Record<string, string> = {
  'x-vercel-protection-bypass': bypass,
  'x-vercel-set-bypass-cookie': 'true',
};

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    baseURL,
    extraHTTPHeaders,
    storageState: 'tests/e2e/.auth/demo.json',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
