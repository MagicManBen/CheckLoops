import { chromium } from 'playwright';

async function debugJSErrors() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture ALL console messages and page errors
  page.on('console', msg => {
    console.log(`BROWSER ${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
  });
  
  try {
    console.log('🔍 Checking for JavaScript errors on admin page...');
    
    // Login first
    await page.goto('http://127.0.0.1:5500/home.html');
    await page.waitForTimeout(2000);
    
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('#password', 'Hello1!');
    await page.click('button[type="submit"]:has-text("Sign In")');
    
    await page.waitForTimeout(5000);
    
    if (!page.url().includes('staff.html')) {
      console.log('❌ Login failed');
      return;
    }
    
    console.log('✅ Logged in, clicking admin button...');
    
    // Navigate to admin page
    const adminButton = await page.locator('button:has-text("Admin Site")').first();
    await adminButton.click();
    
    // Wait for redirect and check for errors
    console.log('⏳ Waiting for admin page and checking for JavaScript errors...');
    await page.waitForTimeout(10000);
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check if the main script elements are present
    const scriptCount = await page.locator('script').count();
    console.log('Number of script elements:', scriptCount);
    
    // Check if the main elements exist
    const userName = await page.locator('#user-name').count();
    const siteInfo = await page.locator('#site-info').count();
    console.log('user-name element count:', userName);
    console.log('site-info element count:', siteInfo);
    
    // Try to run some JavaScript directly on the page
    const jsTest = await page.evaluate(() => {
      return {
        hasSupabase: typeof supabase !== 'undefined',
        hasConsole: typeof console !== 'undefined',
        hasBootstrap: typeof bootstrap !== 'undefined',
        hasLoadContext: typeof loadContext !== 'undefined',
        documentReady: document.readyState
      };
    });
    
    console.log('JavaScript environment:', jsTest);
    
    await page.screenshot({ path: 'test-admin-js-debug.png' });
    
  } catch (error) {
    console.error('Debug error:', error.message);
  } finally {
    await browser.close();
  }
}

debugJSErrors().catch(console.error);