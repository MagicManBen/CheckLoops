// @ts-check
import { test, expect } from '@playwright/test';
import { isLoggedIn, takeScreenshot, waitForPageLoad } from '../utils/test-helpers.js';

// Base URL from config
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:50253';

// Test suite for navigation and redirection rules
test.describe('Navigation and Redirection Tests', () => {
  // Test root address redirection
  test('root address should load landing or redirect to home', async ({ page }) => {
    await page.goto(baseURL);
    await waitForPageLoad(page);
    const url = page.url();
    // Accept either staying on index or redirecting to home
    expect(url).toMatch(/\/(index\.html)?$|home\.html/);
    await takeScreenshot(page, 'root-load');
  });
  
  // Test direct access to staff.html without authentication
  test('unauthenticated access to staff.html should redirect to home.html', async ({ page }) => {
    // Try to access staff page directly
    await page.goto(`${baseURL}/staff.html`);
    await waitForPageLoad(page);
    
    // Verify redirection to home.html
    const url = page.url();
    expect(url).toContain('home.html');
    
    // Take a screenshot
    await takeScreenshot(page, 'staff-unauthenticated-redirect');
  });
  
  // Test direct access to index.html (admin) without authentication
  test('unauthenticated access to admin dashboard should redirect to login/home', async ({ page }) => {
    // Try to access admin dashboard directly
    await page.goto(`${baseURL}/admin-dashboard.html`);
    await waitForPageLoad(page);
    
    const url = page.url();
    expect(url).toMatch(/admin-login\.html|home\.html/);
    await takeScreenshot(page, 'admin-unauthenticated-redirect');
  });
  
  // Test staff user trying to access admin page
  test('staff user access to admin dashboard should be blocked', async ({ page }) => {
    // Log in as staff
    const STAFF_EMAIL = process.env.STAFF_EMAIL || 'ben.howard@stoke.nhs.uk';
    const STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'Hello1!';
    await page.goto(`${baseURL}/home.html`);
    await waitForPageLoad(page);
    await page.fill('#email', STAFF_EMAIL);
    await page.fill('#password', STAFF_PASSWORD);
    await Promise.all([
      page.click('button[type="submit"], #login-button'),
      page.waitForNavigation({ waitUntil: 'networkidle' })
    ]);
    // Try to access admin dashboard
    await page.goto(`${baseURL}/admin-dashboard.html`);
    await waitForPageLoad(page);
    const url = page.url();
    expect(url).toMatch(/admin-login\.html|home\.html/);
    await takeScreenshot(page, 'admin-staff-redirect');
  });
  
  // Test admin navigation between staff and admin pages
  test('admin user can open staff and admin portals', async ({ page }) => {
    // Login via staff login
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'benhowardmagic@hotmail.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Hello1!';
    await page.goto(`${baseURL}/home.html`);
    await waitForPageLoad(page);
    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);
    await Promise.all([
      page.click('button[type="submit"], #login-button'),
      page.waitForNavigation({ waitUntil: 'networkidle' })
    ]);
    await expect(page).toHaveURL(new RegExp('staff\\.html'));
    await takeScreenshot(page, 'admin-on-staff-page');

    // Open admin portal
    await page.goto(`${baseURL}/admin-login.html`);
    await waitForPageLoad(page);
    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);
    await Promise.all([
      page.click('#submit-btn, button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle' })
    ]);
    await expect(page).toHaveURL(new RegExp('admin-dashboard\\.html$'));
    await takeScreenshot(page, 'admin-on-admin-page');
  });
  
  // Test navigation menu for staff user
  test('staff user sees expected staff navigation', async ({ page }) => {
    // Log in as staff
    const STAFF_EMAIL = process.env.STAFF_EMAIL || 'ben.howard@stoke.nhs.uk';
    const STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'Hello1!';
    await page.goto(`${baseURL}/home.html`);
    await waitForPageLoad(page);
    await page.fill('#email', STAFF_EMAIL);
    await page.fill('#password', STAFF_PASSWORD);
    await Promise.all([
      page.click('button[type="submit"], #login-button'),
      page.waitForNavigation({ waitUntil: 'networkidle' })
    ]);
    await page.goto(`${baseURL}/staff.html`);
    await waitForPageLoad(page);

    // Buttons exist and do not include admin
    await expect(page.locator('.seg-nav button:has-text("Home")')).toHaveCount(1);
    await expect(page.locator('.seg-nav button:has-text("Welcome")')).toHaveCount(1);
    await expect(page.locator('.seg-nav button:has-text("Admin Site")')).toHaveCount(0);
    await takeScreenshot(page, 'staff-navigation');
  });
  
  // Test navigation menu for admin user
  test('admin user uses separate admin portal (no Admin Site in staff nav)', async ({ page }) => {
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'benhowardmagic@hotmail.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Hello1!';
    await page.goto(`${baseURL}/home.html`);
    await waitForPageLoad(page);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await Promise.all([
      page.click('button[type="submit"], #login-button'),
      page.waitForNavigation({ waitUntil: 'networkidle' })
    ]);
    await page.goto(`${baseURL}/staff.html`);
    await expect(page.locator('.seg-nav button:has-text("Admin Site")')).toHaveCount(0);
    await takeScreenshot(page, 'admin-staff-nav-no-admin');
  });
});
