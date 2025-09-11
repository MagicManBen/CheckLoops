import { chromium } from 'playwright';

const BASE_URL = 'http://127.0.0.1:65046';
const STAFF_EMAIL = 'benhowardmagic@hotmail.com';
const PASSWORD = 'Hello1!';

async function testHolidaySubmit() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Browser Error:', msg.text());
    }
  });
  
  try {
    // Login
    console.log('🔐 Logging in...');
    await page.goto(`${BASE_URL}/home.html`);
    await page.locator('#email').fill(STAFF_EMAIL);
    await page.locator('#password').fill(PASSWORD);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/staff.html', { timeout: 10000 });
    
    // Navigate to holidays
    console.log('📍 Going to holidays page...');
    await page.click('a[href="staff-holidays.html"]');
    await page.waitForTimeout(3000);
    
    // Open modal
    console.log('📝 Opening request modal...');
    await page.evaluate(() => {
      if (typeof openRequestModal === 'function') {
        openRequestModal();
      }
      const modal = document.getElementById('request-modal');
      if (modal) modal.style.display = 'block';
    });
    await page.waitForTimeout(1000);
    
    // Fill form
    console.log('📝 Filling form...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    await page.fill('#start-date', tomorrow.toISOString().split('T')[0]);
    await page.fill('#end-date', dayAfter.toISOString().split('T')[0]);
    
    // Select holiday type (make sure it's 'holiday' which will map to 'annual_leave')
    await page.selectOption('#request-type', 'holiday');
    
    // Fill destination
    await page.fill('#destination', 'Tokyo, Japan');
    
    // Fill reason
    const reasonInput = await page.$('#reason, textarea');
    if (reasonInput) {
      await reasonInput.fill('Vacation to Tokyo');
    }
    
    // Submit
    console.log('🚀 Submitting...');
    await page.click('button:has-text("Submit Request")');
    
    // Wait for response
    await page.waitForTimeout(5000);
    
    // Check for alerts
    page.on('dialog', async dialog => {
      console.log('📢 Alert:', dialog.message());
      await dialog.accept();
    });
    
    // Take screenshot
    await page.screenshot({ path: 'holiday_submitted.png', fullPage: true });
    console.log('📸 Screenshot saved');
    
    // Check for avatar
    const avatarCount = await page.$$eval('img[alt*="Holiday"], .holiday-destination-image img', els => els.length);
    console.log(`🖼️ Found ${avatarCount} avatar image(s)`);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testHolidaySubmit().catch(console.error);
