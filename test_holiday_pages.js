import { chromium } from 'playwright';

async function testHolidayPages() {
  console.log('Starting holiday pages test...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  try {
    // Navigate to Home.html
    console.log('Navigating to Home.html...');
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.waitForTimeout(3000);
    
    // Login with admin credentials
    console.log('Logging in with admin credentials...');
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Take screenshot of login page
    await page.screenshot({ path: 'login_result.png' });
    console.log('Login screenshot saved');
    
    // Navigate directly to admin dashboard after login
    console.log('Navigating to admin dashboard...');
    await page.goto('http://127.0.0.1:58156/admin-dashboard.html');
    await page.waitForTimeout(5000);
    
    // Take screenshot of admin dashboard
    await page.screenshot({ path: 'admin_dashboard.png' });
    console.log('Admin dashboard screenshot saved');
    
    // First expand the holidays group if it's collapsed
    console.log('Expanding holidays group...');
    await page.click('#toggle-holidays');
    await page.waitForTimeout(1000);
    
    // Navigate to Holiday Requests
    console.log('Navigating to Holiday Requests...');
    await page.click('button[data-section="holidays-management"]');
    await page.waitForTimeout(5000);
    
    // Take screenshot of Holiday Requests page
    await page.screenshot({ path: 'holiday_requests.png' });
    console.log('Holiday Requests screenshot saved');
    
    // Check if the table is loading or has data
    const requestsTableContent = await page.locator('#holiday-requests-tbody').textContent();
    console.log('Holiday Requests table content:', requestsTableContent);
    
    // Navigate to Holiday Calendar
    console.log('Navigating to Holiday Calendar...');
    await page.click('button[data-section="holidays-calendar"]');
    await page.waitForTimeout(5000);
    
    // Take screenshot of Holiday Calendar page
    await page.screenshot({ path: 'holiday_calendar.png' });
    console.log('Holiday Calendar screenshot saved');
    
    // Check calendar content
    const calendarContent = await page.locator('#holidays-calendar-container').textContent();
    console.log('Holiday Calendar content:', calendarContent);
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'error_screenshot.png' });
  } finally {
    await browser.close();
  }
}

testHolidayPages();