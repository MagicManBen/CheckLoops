import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  headless: false,
  slowMo: 500
});
const page = await browser.newPage();

try {
  console.log('Loading page...');
  await page.goto('http://127.0.0.1:58156/index.html');
  await page.waitForTimeout(2000);
  
  // Take screenshot to see what's on screen
  await page.screenshot({ path: 'final_test_no_nav.png' });
  
  // Check if we're already logged in or need to show login
  const emailField = await page.locator('#auth-email').isVisible().catch(() => false);
  console.log('Email field visible?', emailField);
  
  if (!emailField) {
    // Maybe we need to click a login button first?
    const loginBtn = await page.locator('button:has-text("Login"), button:has-text("Sign In")').first();
    if (await loginBtn.isVisible()) {
      console.log('Clicking login button to show form...');
      await loginBtn.click();
      await page.waitForTimeout(1000);
    }
  }
  
  // Now try to fill credentials
  console.log('Filling email...');
  await page.locator('#auth-email').fill('ben.howard@stoke.nhs.uk');
  
  console.log('Filling password...');
  await page.locator('#auth-password').fill('Hello1!');
  
  await page.screenshot({ path: 'final_test_credentials.png' });
  
  console.log('Clicking Sign In...');
  await page.locator('button:has-text("Sign In")').click();
  
  console.log('Waiting for login...');
  await page.waitForTimeout(5000);
  
  await page.screenshot({ path: 'final_test_after_login.png' });
  
  // Keep open to observe
  console.log('Keeping browser open for 10 seconds...');
  await page.waitForTimeout(10000);
  
} catch (error) {
  console.error('Error:', error.message);
  await page.screenshot({ path: 'error_final.png' });
} finally {
  await browser.close();
  console.log('Done');
}
