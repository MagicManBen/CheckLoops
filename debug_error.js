import { chromium } from 'playwright';

async function debugError() {
  console.log('Debugging login and navigation issues...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('PAGE ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.log('PAGE CRASH:', error.message);
  });
  
  try {
    console.log('1. Opening local file...');
    await page.goto('file:///Users/benhoward/Desktop/CheckLoop/CheckLoops/index.html');
    await page.waitForTimeout(2000);
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'debug_1_initial.png' });
    console.log('Initial screenshot saved as debug_1_initial.png');
    
    // Check if login form is visible
    const emailVisible = await page.locator('#email').isVisible();
    const passwordVisible = await page.locator('#password').isVisible();
    console.log(`Email field visible: ${emailVisible}`);
    console.log(`Password field visible: ${passwordVisible}`);
    
    if (emailVisible && passwordVisible) {
      console.log('2. Attempting login...');
      await page.fill('#email', 'ben.howard@stoke.nhs.uk');
      await page.fill('#password', 'Hello1!');
      
      // Look for sign in button
      const signInBtn = await page.locator('button:has-text("Sign In")').count();
      console.log(`Sign In buttons found: ${signInBtn}`);
      
      if (signInBtn > 0) {
        await page.click('button:has-text("Sign In")');
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: 'debug_2_after_login.png' });
        console.log('After login screenshot saved as debug_2_after_login.png');
        
        // Check what's visible after login
        const sidebarVisible = await page.locator('#sidebar').isVisible();
        const navButtons = await page.locator('.nav button').count();
        console.log(`Sidebar visible: ${sidebarVisible}`);
        console.log(`Navigation buttons found: ${navButtons}`);
      }
    }
    
    // Check for any JavaScript errors in console
    const errors = await page.evaluate(() => {
      return window.consoleErrors || [];
    });
    
    if (errors.length > 0) {
      console.log('JavaScript errors found:', errors);
    }
    
  } catch (error) {
    console.error('Error during debugging:', error.message);
    await page.screenshot({ path: 'debug_error.png' });
  }
  
  console.log('\nKeeping browser open for inspection...');
  await page.waitForTimeout(10000);
  await browser.close();
}

debugError();