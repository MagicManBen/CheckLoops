// @ts-check
import { test, expect } from '@playwright/test';
import { getAuthState, waitForPageLoad } from '../utils/test-helpers.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Base URL from config
const baseURL = process.env.BASE_URL || 'http://localhost:5173';

// Set up screenshot directory
const screenshotDir = path.join(__dirname, '..', '..', 'test-results', 'visual-comparison');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// Define pages to capture for both roles
const pagesToCapture = {
  unauthenticated: [
    { url: '/home.html', name: 'home' },
    { url: '/simple-set-password.html', name: 'set-password' },
  ],
  staff: [
    { url: '/staff.html', name: 'staff-dashboard' },
    { url: '/staff-calendar.html', name: 'staff-calendar' },
    { url: '/staff-meetings.html', name: 'staff-meetings' },
    { url: '/staff-quiz.html', name: 'staff-quiz' },
    { url: '/staff-training.html', name: 'staff-training' },
    { url: '/achievements.html', name: 'staff-achievements' },
    { url: '/staff-welcome.html', name: 'staff-welcome' },
  ],
  admin: [
    { url: '/index.html', name: 'admin-dashboard' },
    { url: '/admin-dashboard.html', name: 'admin-main' },
  ],
};

// Test suite for visual regression testing
test.describe('Visual Regression Tests', () => {
  // Test unauthenticated pages
  test('capture screenshots of unauthenticated pages', async ({ page }) => {
    for (const pageInfo of pagesToCapture.unauthenticated) {
      // Navigate to the page
      await page.goto(`${baseURL}${pageInfo.url}`);
      await waitForPageLoad(page);
      
      // Capture screenshot
      const screenshotPath = path.join(screenshotDir, `${pageInfo.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      
      console.log(`Captured screenshot for ${pageInfo.name} at ${screenshotPath}`);
    }
  });
  
  // Test staff pages
  test('capture screenshots of staff pages', async ({ browser }) => {
    // Create new context with staff authentication
    const context = await browser.newContext({ storageState: getAuthState('staff') });
    const page = await context.newPage();
    
    for (const pageInfo of pagesToCapture.staff) {
      // Navigate to the page
      await page.goto(`${baseURL}${pageInfo.url}`);
      await waitForPageLoad(page);
      
      // Capture screenshot
      const screenshotPath = path.join(screenshotDir, `${pageInfo.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      
      console.log(`Captured screenshot for ${pageInfo.name} at ${screenshotPath}`);
    }
  });
  
  // Test admin pages
  test('capture screenshots of admin pages', async ({ browser }) => {
    // Create new context with admin authentication
    const context = await browser.newContext({ storageState: getAuthState('admin') });
    const page = await context.newPage();
    
    for (const pageInfo of pagesToCapture.admin) {
      // Navigate to the page
      await page.goto(`${baseURL}${pageInfo.url}`);
      await waitForPageLoad(page);
      
      // Capture screenshot
      const screenshotPath = path.join(screenshotDir, `${pageInfo.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      
      console.log(`Captured screenshot for ${pageInfo.name} at ${screenshotPath}`);
    }
  });
  
  // Test responsive views for key pages
  test('capture responsive screenshots of key pages', async ({ browser }) => {
    // Define key pages to test responsively
    const keyPages = [
      { url: '/home.html', name: 'home' },
      { url: '/staff.html', name: 'staff-dashboard' },
    ];
    
    // Define viewport sizes to test
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1024, height: 768, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' },
    ];
    
    // Create new context with admin authentication for authenticated pages
    const adminContext = await browser.newContext({ storageState: getAuthState('admin') });
    
    for (const pageInfo of keyPages) {
      for (const viewport of viewports) {
        // Use admin context for staff page, regular page for home
        const context = pageInfo.url.includes('staff') ? adminContext : await browser.newContext();
        const page = await context.newPage();
        
        // Set viewport size
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Navigate to the page
        await page.goto(`${baseURL}${pageInfo.url}`);
        await waitForPageLoad(page);
        
        // Capture screenshot
        const screenshotPath = path.join(screenshotDir, `${pageInfo.name}-${viewport.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        
        console.log(`Captured responsive screenshot for ${pageInfo.name} at ${viewport.name} resolution`);
        
        // Close the page for non-admin context
        if (!pageInfo.url.includes('staff')) {
          await page.close();
          await context.close();
        }
      }
    }
  });
});