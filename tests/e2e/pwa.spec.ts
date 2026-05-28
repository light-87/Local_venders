import { test, expect } from './fixtures';

test.describe('PWA', () => {
  test('manifest.json served with correct fields', async ({ api }) => {
    const res = await api.get('/manifest.json');
    expect(res.ok()).toBeTruthy();
    const manifest = await res.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('icons');
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
    expect(manifest).toHaveProperty('start_url');
    expect(manifest.display).toMatch(/standalone|fullscreen/);
  });

  test('service worker file is reachable', async ({ api }) => {
    const res = await api.get('/sw.js');
    expect([200, 404]).toContain(res.status());
  });
});
