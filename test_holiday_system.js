import { chromium } from 'playwright';

async function testHolidaySystem() {
  console.log('🏖️ Testing Holiday Management System...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to admin dashboard
    console.log('📱 Navigating to admin dashboard...');
    await page.goto('http://127.0.0.1:58156/admin-dashboard.html');
    
    // Wait for the page to load
    await page.waitForTimeout(3000);
    
    // Check if holiday navigation exists
    const holidayNavButton = await page.locator('button[data-section="holidays-management"]').first();
    if (await holidayNavButton.count() > 0) {
      console.log('✅ Holiday management navigation found');
      
      // Click on holiday management
      await holidayNavButton.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot of holiday management interface
      await page.screenshot({ path: 'test_holiday_admin.png', fullPage: true });
      console.log('📸 Screenshot saved: test_holiday_admin.png');
      
      // Check if holiday settings exists
      const settingsButton = await page.locator('button[data-section="holidays-settings"]').first();
      if (await settingsButton.count() > 0) {
        await settingsButton.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'test_holiday_settings.png', fullPage: true });
        console.log('📸 Screenshot saved: test_holiday_settings.png');
      }
      
      // Check holiday calendar
      const calendarButton = await page.locator('button[data-section="holidays-calendar"]').first();
      if (await calendarButton.count() > 0) {
        await calendarButton.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'test_holiday_calendar.png', fullPage: true });
        console.log('📸 Screenshot saved: test_holiday_calendar.png');
      }
      
    } else {
      console.log('❌ Holiday management navigation not found');
    }
    
    // Now test staff holiday interface
    console.log('👤 Testing staff holiday interface...');
    await page.goto('http://127.0.0.1:58156/staff-holidays.html');
    await page.waitForTimeout(3000);
    
    // Check if staff holiday page loads
    const staffHolidayTitle = await page.locator('h1').first();
    if (await staffHolidayTitle.count() > 0) {
      const titleText = await staffHolidayTitle.textContent();
      if (titleText?.includes('Holiday') || titleText?.includes('My Holidays')) {
        console.log('✅ Staff holiday page loaded successfully');
        await page.screenshot({ path: 'test_staff_holidays.png', fullPage: true });
        console.log('📸 Screenshot saved: test_staff_holidays.png');
        
        // Test holiday request modal
        const requestButton = await page.locator('text=Request Holiday').first();
        if (await requestButton.count() > 0) {
          await requestButton.click();
          await page.waitForTimeout(1000);
          
          // Check if modal opened
          const modal = await page.locator('.modal').first();
          if (await modal.isVisible()) {
            console.log('✅ Holiday request modal opened');
            await page.screenshot({ path: 'test_holiday_request_modal.png' });
            console.log('📸 Screenshot saved: test_holiday_request_modal.png');
          }
        }
      }
    } else {
      console.log('❌ Staff holiday page not found or not loading');
    }
    
    console.log('🎉 Holiday system testing completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    await page.screenshot({ path: 'test_holiday_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testHolidaySystem().catch(console.error);