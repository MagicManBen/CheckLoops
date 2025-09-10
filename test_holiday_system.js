import { chromium } from 'playwright';

async function testHolidaySystem() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing Holiday System...');
  
  try {
    // Login flow
    console.log('1. Logging in...');
    await page.goto('http://127.0.0.1:65046/Home.html');
    await page.waitForLoadState('networkidle');
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    console.log('2. Taking login screenshot...');
    await page.screenshot({ path: 'login_success.png' });
    
    // Click on Holiday tab to see staff view
    console.log('3. Clicking Holiday tab...');
    await page.click('text=Holiday');
    await page.waitForTimeout(2000);
    
    console.log('4. Taking staff holiday view screenshot...');
    await page.screenshot({ path: 'staff_holiday_view.png' });
    
    // Check for existing requests in staff view
    console.log('5. Checking for existing holiday requests in staff view...');
    const existingRequests = await page.locator('[class*="holiday-item"]').count();
    console.log(`Found ${existingRequests} existing holiday requests`);
    
    // Click Admin Page button
    console.log('6. Clicking Admin Page button...');
    await page.click('text=Admin Page');
    await page.waitForTimeout(2000);
    
    console.log('7. Taking admin page screenshot...');
    await page.screenshot({ path: 'admin_page.png' });
    
    // Look for holiday dropdown in menu
    console.log('8. Looking for holiday dropdown in admin menu...');
    const holidayDropdown = await page.locator('text=Holiday').first();
    if (await holidayDropdown.isVisible()) {
      console.log('✓ Holiday dropdown found in admin menu');
      await holidayDropdown.click();
      await page.waitForTimeout(1000);
      
      console.log('9. Taking holiday dropdown screenshot...');
      await page.screenshot({ path: 'holiday_dropdown.png' });
      
      // Check for different holiday management pages
      const holidayOptions = await page.locator('[data-section*="holiday"]').count();
      console.log(`Found ${holidayOptions} holiday management options`);
      
    } else {
      console.log('✗ Holiday dropdown not found in admin menu');
    }
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test_error.png' });
  } finally {
    await browser.close();
  }
}

testHolidaySystem();