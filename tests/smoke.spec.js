import { test, expect } from '@playwright/test';

test('Dashboard loads after login', async ({ page }) => {
  // Go directly to the admin dashboard
  await page.goto('/index.html');

  // Confirm the auth overlay is gone and a known element is visible
  await expect(page.locator('#auth-wrapper')).toBeHidden({ timeout: 20000 });
  await expect(page.locator('#email-pill')).toBeVisible();

  // A core nav item visible for logged-in users
  await expect(page.getByRole('button', { name: /mandatory training/i })).toBeVisible();
});

