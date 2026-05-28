import { test as base, expect, type APIRequestContext } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

type Fixtures = {
  api: APIRequestContext;
  unique: string;
};

const STORAGE = path.join(__dirname, '.auth', 'demo.json');

export const test = base.extend<Fixtures>({
  api: async ({ playwright }, use) => {
    const bypass = process.env.VERCEL_BYPASS_TOKEN!;
    const baseURL = process.env.E2E_BASE_URL || 'https://kuberbook.shop';
    const storageState = fs.existsSync(STORAGE) ? STORAGE : undefined;
    const ctx = await playwright.request.newContext({
      baseURL,
      storageState,
      extraHTTPHeaders: {
        'x-vercel-protection-bypass': bypass,
        'x-vercel-set-bypass-cookie': 'true',
      },
    });
    await use(ctx);
    await ctx.dispose();
  },

  unique: async ({}, use) => {
    const tag = `e2e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    await use(tag);
  },
});

export { expect };
