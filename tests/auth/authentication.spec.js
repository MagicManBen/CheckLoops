// @ts-check
import { test, expect } from '@playwright/test';
import { getAuthState, isLoggedIn, takeScreenshot, waitForPageLoad } from '../utils/test-helpers.js';

// Base URL from config
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:50253';

// Credentials for testing
const STAFF_EMAIL = process.env.STAFF_EMAIL || 'ben.howard@stoke.nhs.uk';
const STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'Hello1!';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'benhowardmagic@hotmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Hello1!';

// Test suite for home page and authentication
test.describe('Authentication Flow Tests', () => {
  // Test case for accessing the home page
  test('should load the home page correctly', async ({ page }) => {
    // Navigate to the home page
    await page.goto(`${baseURL}/home.html`);
    await waitForPageLoad(page);
    
    // Verify the page loads correctly
    const title = await page.title();
    expect(title).toMatch(/CheckLoop/i);
    
    // Take a screenshot
    await takeScreenshot(page, 'home-page');
    
    // Check for login form elements
    const emailField = await page.$('input[type="email"]');
    const passwordField = await page.$('input[type="password"]');
    const loginButton = await page.$('button[type="submit"], #login-button');
    
    expect(emailField).toBeTruthy();
    expect(passwordField).toBeTruthy();
    expect(loginButton).toBeTruthy();
  });
  
  // Test case for staff login
  test('should login with staff credentials and redirect to staff page', async ({ page }) => {
    // Navigate to the home page
    await page.goto(`${baseURL}/home.html`);
    await waitForPageLoad(page);
    
    // Fill in login form with staff credentials
    await page.fill('#email', STAFF_EMAIL);
    await page.fill('#password', STAFF_PASSWORD);
    
    // Take screenshot before login
    await takeScreenshot(page, 'before-staff-login');
    
    // Click login button and wait for navigation
    await Promise.all([
      page.click('button[type="submit"], #login-button'),
      page.waitForNavigation({ waitUntil: 'networkidle' })
    ]);
    
    // Take screenshot after login
    await takeScreenshot(page, 'after-staff-login');
    
    // Verify redirection to staff.html
    const url = page.url();
    expect(url).toContain('staff.html');
    
    // Verify user is logged in
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBeTruthy();
    
    // Verify staff dashboard elements
    const dashboardTitle = await page.textContent('h1, .dashboard-title, .page-title');
    expect(dashboardTitle).toBeTruthy();
  });
  
  // Test case for admin login
  test('should login as admin to staff portal, then access admin portal', async ({ page }) => {
    // Login via staff login page
    await page.goto(`${baseURL}/home.html`);
    await waitForPageLoad(page);

    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);
    await takeScreenshot(page, 'before-admin-staff-login');
    await Promise.all([
      page.click('button[type="submit"], #login-button'),
      page.waitForNavigation({ waitUntil: 'networkidle' })
    ]);
    await takeScreenshot(page, 'after-admin-staff-login');
    expect(page.url()).toContain('staff.html');

    // Now navigate to admin portal and login
    await page.goto(`${baseURL}/admin-login.html`);
    await waitForPageLoad(page);
    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);
    await takeScreenshot(page, 'before-admin-portal-login');
    await Promise.all([
      page.click('#submit-btn, button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle' })
    ]);
    await takeScreenshot(page, 'after-admin-portal-login');
    expect(page.url()).toMatch(/admin-dashboard\.html$/);
  });
  
  // Test case for invalid login
  test('should show error message with invalid credentials', async ({ page }) => {
    // Navigate to the home page
    await page.goto(`${baseURL}/home.html`);
    await waitForPageLoad(page);
    
    // Fill in login form with invalid credentials
    await page.fill('#email', 'invalid@example.com');
    await page.fill('#password', 'wrongpassword');
    
    // Take screenshot before login
    await takeScreenshot(page, 'before-invalid-login');
    
    // Click login button
    await page.click('button[type="submit"], #login-button');
    
    // Wait for error message
    await page.waitForSelector('#auth-error, .error-message, .alert-error, [role="alert"]', { timeout: 5000 });
    
    // Take screenshot after failed login
    await takeScreenshot(page, 'after-invalid-login');
    
    // Verify error message
    const errorMessage = await page.textContent('#auth-error, .error-message, .alert-error, [role="alert"]');
    expect(errorMessage).toBeTruthy();
    
    // Verify still on login page
    const url = page.url();
    expect(url).toContain('home.html');
  });
  
  // Test case for logout
  test('should successfully logout', async ({ browser }) => {
    // Create new context with authenticated state
    const context = await browser.newContext({ storageState: getAuthState('staff') });
    const page = await context.newPage();
    
    // Navigate to staff page
    await page.goto(`${baseURL}/staff.html`);
    await waitForPageLoad(page);
    
    // Verify logged in
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBeTruthy();
    
    // Take screenshot before logout
    await takeScreenshot(page, 'before-logout');
    
    // Find and click logout button
    const logoutButton = await page.$('#logout-btn, button:has-text("Sign Out"), button:has-text("Logout"), a:has-text("Logout"), .logout-button');
    expect(logoutButton).toBeTruthy();
    
    if (logoutButton) {
      await Promise.all([
        logoutButton.click(),
        page.waitForNavigation({ waitUntil: 'networkidle' })
      ]);
    }
    
    // Take screenshot after logout
    await takeScreenshot(page, 'after-logout');
    
    // Verify redirection to home.html
    const url = page.url();
    expect(url).toContain('home.html');
    
    // Verify login form is visible again
    const emailField = await page.$('input[type="email"]');
    expect(emailField).toBeTruthy();
  });
});
