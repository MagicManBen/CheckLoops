import { chromium } from 'playwright';

async function debugLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen to console messages
  page.on('console', msg => {
    console.log('BROWSER:', msg.type(), msg.text());
  });
  
  // Listen to page errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  try {
    console.log('🔍 Debugging login process...');
    
    // Step 1: Go to homepage
    await page.goto('http://127.0.0.1:5500/homepage.html');
    await page.waitForTimeout(2000);
    console.log('✅ On homepage');
    
    // Step 2: Navigate to login
    await page.click('button:has-text("Sign In"), a:has-text("Sign In"), .btn.primary');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('✅ On login page');
    
    // Check if login-handler.js is loaded
    const loginHandlerLoaded = await page.evaluate(() => {
      return document.querySelector('script[src*="login-handler.js"]') !== null;
    });
    console.log('Login handler script loaded:', loginHandlerLoaded);
    
    // Step 3: Fill in credentials and submit
    console.log('Filling credentials...');
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('#password', 'Hello1!');
    
    // Wait a moment and check for any error messages
    await page.waitForTimeout(1000);
    
    console.log('Submitting form...');
    await page.click('button[type="submit"]:has-text("Sign In")');
    
    // Wait and check for success/error messages
    await page.waitForTimeout(3000);
    
    // Check for auth error div
    const errorDiv = await page.locator('#auth-error').textContent().catch(() => '');
    const successDiv = await page.locator('#auth-success').textContent().catch(() => '');
    
    console.log('Auth error:', errorDiv || 'None');
    console.log('Auth success:', successDiv || 'None');
    
    // Check current URL after a bit more time
    await page.waitForTimeout(2000);
    console.log('Current URL after login attempt:', page.url());
    
    // Check if we can access the auth module directly
    const authCoreTest = await page.evaluate(async () => {
      try {
        const authCore = await import('./auth-core.js');
        return 'Auth core module loaded successfully';
      } catch (error) {
        return 'Auth core error: ' + error.message;
      }
    });
    console.log('Auth core test:', authCoreTest);
    
    await page.screenshot({ path: 'debug-login-final.png' });
    
  } catch (error) {
    console.error('Debug error:', error.message);
    await page.screenshot({ path: 'debug-login-error.png' });
  } finally {
    await browser.close();
  }
}

debugLogin().catch(console.error);