// @ts-check
import { chromium } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure environment
dotenv.config();

// Credentials stored in environment or passed directly here
const STAFF_EMAIL = process.env.STAFF_EMAIL || 'ben.howard@stoke.nhs.uk';
const STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'Hello1!';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'benhowardmagic@hotmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Hello1!';

/**
 * Global setup for authentication
 */
async function globalSetup(config) {
  const { baseURL, storageState } = config.projects[0].use;
  
  // Store authentication states for different roles
  const authStates = {
    staff: path.join(__dirname, 'auth-states/staff.json'),
    admin: path.join(__dirname, 'auth-states/admin.json'),
  };
  
  // Create directory if it doesn't exist
  const authStatesDir = path.join(__dirname, 'auth-states');
  if (!fs.existsSync(authStatesDir)) {
    fs.mkdirSync(authStatesDir, { recursive: true });
  }

  // Setup for staff role
  await setupAuthForRole({
    baseURL,
    email: STAFF_EMAIL,
    password: STAFF_PASSWORD,
    storageStatePath: authStates.staff,
    roleType: 'staff'
  });

  // Setup for admin role
  await setupAuthForRole({
    baseURL,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    storageStatePath: authStates.admin,
    roleType: 'admin'
  });

  // Store paths to authentication state files
  fs.writeFileSync(
    path.join(__dirname, 'auth-states/config.json'),
    JSON.stringify(authStates, null, 2)
  );
}

/**
 * Set up authentication for a specific role
 */
async function setupAuthForRole({ baseURL, email, password, storageStatePath, roleType }) {
  // Launch browser
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`Setting up authentication for ${roleType} role...`);
    
    // Navigate directly to login page
    const loginUrl = baseURL.endsWith('.html') ? baseURL : `${baseURL.replace(/\/$/, '')}/home.html`;
    await page.goto(loginUrl);
    
    // Wait for the login form to be available
    await page.waitForSelector('form input[type="email"]');
    
    // Fill in login form
    await page.fill('form input[type="email"]', email);
    await page.fill('form input[type="password"]', password);
    
    // Submit the login form
    await page.click('button[type="submit"], input[type="submit"], form button:not([type]), #login-button');
    
    // Wait for login to complete
    // This could be waiting for a specific element that appears post-login
    // or waiting for navigation to complete to a known post-login URL
    await page.waitForURL(/staff\.html|index\.html/);
    
    console.log(`Successfully authenticated as ${roleType}`);
    
    // Save authentication state to file
    await context.storageState({ path: storageStatePath });
  } catch (error) {
    console.error(`Failed to set up authentication for ${roleType}:`, error);
    throw error;
  } finally {
    // Close browser
    await browser.close();
  }
}

export default globalSetup;
