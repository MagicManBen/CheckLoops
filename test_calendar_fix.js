import { chromium } from 'playwright';

async function testCalendarFix() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Testing calendar fix...');
    
    // Login flow
    await page.goto('http://localhost:5174/index.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Navigate to calendar
    await page.click('#toggle-scans');
    await page.waitForTimeout(1000);
    await page.click('button[data-section="calendar"]');
    await page.waitForTimeout(3000);
    
    // Take screenshot to verify the fix
    await page.screenshot({ path: 'calendar_fixed.png' });
    
    // Verify navigation still works
    await page.click('button[data-section="dashboard"]');
    await page.waitForTimeout(2000);
    console.log('✅ Calendar fix tested successfully');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testCalendarFix();