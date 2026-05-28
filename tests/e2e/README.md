# Kuberbook E2E Tests (Playwright)

Smoke suite that runs against **production** (`https://kuberbook.shop`) using the Vercel protection bypass header.

## Setup

1. Install browsers (one-time):
   ```sh
   bunx playwright install chromium
   ```

2. Create `.env.test` in the repo root (already gitignored):
   ```env
   VERCEL_BYPASS_TOKEN=<token>
   E2E_BASE_URL=https://kuberbook.shop
   DEMO_USERNAME=demo
   DEMO_PIN=12345
   ```

## Run

```sh
bun run test:e2e            # full suite, both projects
bun run test:e2e:ui         # interactive UI mode
bun run test:e2e:headed     # watch in a real browser
bun run test:e2e:report     # open last HTML report
```

Target a single spec:
```sh
bunx playwright test tests/e2e/auth.spec.ts
```

## How it works

- `global-setup.ts` runs the login flow **once** and saves `storageState` to `tests/e2e/.auth/demo.json`.
- All non-auth specs reuse that storage state — no redundant logins.
- `auth.spec.ts` opts out of stored auth (`storageState: { cookies: [], origins: [] }`) so it can test the login flow itself.
- All requests carry the Vercel bypass header via `extraHTTPHeaders` in `playwright.config.ts`.

## Production safety

The demo account is shared. Tests are **read-mostly**:
- `inventory.spec.ts` creates a uniquely-tagged item and deletes it in the same test.
- All other specs only read.
- Avoid running with `--repeat-each` or full-parallel — `workers: 1` + `fullyParallel: false` already enforced.

## Adding tests

Use the fixtures from `./fixtures`:

```ts
import { test, expect } from './fixtures';

test('my test', async ({ page, api, unique }) => {
  await page.goto('/dashboard');
  // ...
});
```

- `page` — auto-logged-in via storageState
- `api` — APIRequestContext with bypass header pre-applied
- `unique` — random per-test tag, use for created records to avoid collisions
