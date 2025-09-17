// @ts-check
import { test, expect } from '@playwright/test';
import { waitForPageLoad, takeScreenshot } from '../utils/test-helpers.js';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:50253';

test.describe('Access Control & Redirects', () => {
  test('unauthenticated user is redirected from staff and admin pages', async ({ page }) => {
    // Staff page should redirect to home.html
    await page.goto(`${baseURL}/staff.html`);
    await waitForPageLoad(page);
    await takeScreenshot(page, 'redirect-unauth-staff');
    expect(page.url()).toContain('home.html');

    // Admin dashboard should redirect to admin-login or home
    await page.goto(`${baseURL}/admin-dashboard.html`);
    await waitForPageLoad(page);
    await takeScreenshot(page, 'redirect-unauth-admin');
    expect(page.url()).toMatch(/admin-login\.html|home\.html/);
  });

  test('staff user cannot access admin dashboard', async ({ page }) => {
    // Login as staff on home page
    await page.goto(`${baseURL}/home.html`);
    await waitForPageLoad(page);
    const STAFF_EMAIL = process.env.STAFF_EMAIL || 'ben.howard@stoke.nhs.uk';
    const STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'Hello1!';
    await page.fill('#email', STAFF_EMAIL);
    await page.fill('#password', STAFF_PASSWORD);
    await Promise.all([
      page.click('button[type="submit"], #login-button'),
      page.waitForNavigation({ waitUntil: 'networkidle' })
    ]);
    // Navigate to admin dashboard
    await page.goto(`${baseURL}/admin-dashboard.html`);
    await waitForPageLoad(page);
    await takeScreenshot(page, 'redirect-staff-to-admin');
    expect(page.url()).toMatch(/admin-login\.html|home\.html/);
  });

  test('admin user can access admin dashboard', async ({ page }) => {
    await page.goto(`${baseURL}/admin-login.html`);
    await waitForPageLoad(page);
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'benhowardmagic@hotmail.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Hello1!';
    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);
    await Promise.all([
      page.click('#submit-btn, button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle' })
    ]);
    await takeScreenshot(page, 'admin-dashboard');
    expect(page.url()).toMatch(/admin-dashboard\.html$/);
  });
});
