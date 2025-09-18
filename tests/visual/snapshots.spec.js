// @ts-check
import { test } from '@playwright/test';
import { waitForPageLoad, takeScreenshot } from '../utils/test-helpers.js';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:50253';

test.describe('Visual Snapshots', () => {
  test('capture home, staff, and admin pages', async ({ page, browser }) => {
    // Home page
    await page.goto(`${baseURL}/home.html`);
    await waitForPageLoad(page);
    await takeScreenshot(page, 'visual-home');

    // Staff page (authenticated)
    const staffPage = await browser.newPage();
    await staffPage.goto(`${baseURL}/home.html`);
    await waitForPageLoad(staffPage);
    const STAFF_EMAIL = process.env.STAFF_EMAIL || 'ben.howard@stoke.nhs.uk';
    const STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'Hello1!';
    await staffPage.fill('input[type="email"]', STAFF_EMAIL);
    await staffPage.fill('input[type="password"]', STAFF_PASSWORD);
    await Promise.all([
      staffPage.click('button[type="submit"], #login-button'),
      staffPage.waitForNavigation({ waitUntil: 'networkidle' })
    ]);
    await staffPage.goto(`${baseURL}/staff.html`);
    await waitForPageLoad(staffPage);
    await takeScreenshot(staffPage, 'visual-staff');

    // Admin dashboard (authenticated)
    const adminPage = await browser.newPage();
    await adminPage.goto(`${baseURL}/admin-login.html`);
    await waitForPageLoad(adminPage);
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'benhowardmagic@hotmail.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Hello1!';
    await adminPage.fill('#email', ADMIN_EMAIL);
    await adminPage.fill('#password', ADMIN_PASSWORD);
    await Promise.all([
      adminPage.click('#submit-btn, button[type="submit"]'),
      adminPage.waitForNavigation({ waitUntil: 'networkidle' })
    ]);
    await takeScreenshot(adminPage, 'visual-admin');
  });
});
