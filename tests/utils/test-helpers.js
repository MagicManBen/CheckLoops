// @ts-check
import { expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Get the authentication state for a specific role
 * @param {string} role - The role to get the auth state for ('staff' or 'admin')
 * @returns {string} Path to the auth state file
 */
export function getAuthState(role) {
  const configPath = path.join(__dirname, '..', 'auth-states', 'config.json');
  
  if (!fs.existsSync(configPath)) {
    throw new Error('Authentication configuration not found. Run setup first.');
  }
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  if (!config[role]) {
    throw new Error(`No authentication state found for role: ${role}`);
  }
  
  return config[role];
}

/**
 * Check if the user is logged in
 * @param {import('@playwright/test').Page} page - Playwright page
 * @returns {Promise<boolean>} True if logged in, false otherwise
 */
export async function isLoggedIn(page) {
  // Look for elements that would indicate a user is logged in
  // This could be a logout button, user profile element, etc.
  try {
    const logoutButton = await page.$('button#logout-btn, button:has-text("Sign Out"), a:has-text("Logout"), button:has-text("Logout"), .logout-button');
    return !!logoutButton;
  } catch (error) {
    return false;
  }
}

/**
 * Check if the current user has admin access
 * @param {import('@playwright/test').Page} page - Playwright page
 * @returns {Promise<boolean>} True if has admin access, false otherwise
 */
export async function hasAdminAccess(page) {
  try {
    // Look for elements that would indicate admin access
    // This could be an "Admin Site" button, admin dashboard elements, etc.
    const adminButton = await page.$('a:has-text("Admin Site"), button:has-text("Admin Site"), .admin-button');
    return !!adminButton;
  } catch (error) {
    return false;
  }
}

/**
 * Wait for page load with network idle
 * @param {import('@playwright/test').Page} page - Playwright page
 * @returns {Promise<void>}
 */
export async function waitForPageLoad(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
}

/**
 * Take a screenshot and save it with a timestamp
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} name - Name for the screenshot
 * @returns {Promise<void>}
 */
export async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = path.join(__dirname, '..', '..', 'test-results', 'screenshots');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(screenshotPath)) {
    fs.mkdirSync(screenshotPath, { recursive: true });
  }
  
  await page.screenshot({ 
    path: path.join(screenshotPath, `${name}-${timestamp}.png`),
    fullPage: true
  });
}

/**
 * Navigate to a page and verify it loaded correctly
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} url - URL to navigate to
 * @param {string} expectedTitle - Expected page title or text to verify
 * @returns {Promise<void>}
 */
export async function navigateAndVerify(page, url, expectedTitle) {
  await page.goto(url);
  await waitForPageLoad(page);
  
  if (expectedTitle) {
    await expect(page).toHaveTitle(new RegExp(expectedTitle, 'i'));
  }
}

/**
 * Test accessibility of key interactive elements
 * @param {import('@playwright/test').Page} page - Playwright page
 * @returns {Promise<void>}
 */
export async function testAccessibility(page) {
  // Get all interactive elements
  const buttons = await page.$$('button, a[href], input[type="button"], [role="button"]');
  
  // Check that each element is visible and not disabled
  for (const button of buttons) {
    const isVisible = await button.isVisible();
    const isDisabled = await button.isDisabled();
    const text = await button.textContent();
    
    console.log(`Button "${text?.trim()}": visible=${isVisible}, disabled=${isDisabled}`);
  }
}

/**
 * Fill a form with the given data
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {Object} formData - Key-value pairs for form fields
 * @returns {Promise<void>}
 */
export async function fillForm(page, formData) {
  for (const [selector, value] of Object.entries(formData)) {
    await page.fill(selector, value);
  }
}
