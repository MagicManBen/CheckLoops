// @ts-check
import { test, expect } from '@playwright/test';
import { waitForPageLoad, takeScreenshot } from '../utils/test-helpers.js';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:50253';

test.describe('Staff Dashboard', () => {
  test('loads main components and navigation works', async ({ page }) => {
    // Login as staff
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

    // Arrive at staff dashboard
    await page.goto(`${baseURL}/staff.html`);
    await waitForPageLoad(page);
    await takeScreenshot(page, 'staff-dashboard-initial');

    // Topbar pills and logout button
    await expect(page.locator('#site-pill')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#email-pill')).toBeVisible();
    await expect(page.locator('#role-pill')).toBeVisible();
    await expect(page.locator('#logout-btn')).toBeVisible();

    // Segmented nav exists
    const nav = page.locator('.nav.seg-nav');
    await expect(nav).toBeVisible();
    // Buttons should include Home, Welcome, Meetings, Training, Quiz
    const expectedButtons = ['Home', 'Welcome', 'Meetings', 'My Training', 'Quiz'];
    for (const label of expectedButtons) {
      await expect(nav.locator(`button:has-text("${label}")`)).toHaveCount(1);
    }

    // Navigate to Meetings
    await page.click('.seg-nav button:has-text("Meetings")');
    await page.waitForURL(/staff-meetings\.html/);
    await takeScreenshot(page, 'staff-meetings');

    // Back to Home
    await page.click('.seg-nav button:has-text("Home")');
    await page.waitForURL(/staff\.html/);
    await takeScreenshot(page, 'staff-back-home');
  });
});
