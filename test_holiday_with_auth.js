import { chromium } from 'playwright';

async function testHolidaySystemWithAuth() {
  console.log('🏖️ Testing Holiday Management System with Authentication...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // First, login to the system
    console.log('🔐 Logging in...');
    await page.goto('http://127.0.0.1:58156/index.html');
    await page.waitForTimeout(2000);
    
    // Fill in login form
    const emailInput = await page.locator('#email').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button:has-text("Sign In")').first();
    
    if (await emailInput.count() > 0) {
      await emailInput.fill('ben.howard@stoke.nhs.uk');
      await passwordInput.fill('Hello1!');
      await loginButton.click();
      
      console.log('✅ Login attempted');
      await page.waitForTimeout(3000);
      
      // Check if we're redirected to staff page or admin page
      const currentUrl = page.url();
      console.log('📍 Current URL:', currentUrl);
      
      // If we're on staff page, test staff holiday interface
      if (currentUrl.includes('staff') && !currentUrl.includes('admin')) {
        console.log('👤 Testing staff holiday interface...');
        
        // Look for holiday navigation
        const holidayNav = await page.locator('a:has-text("My Holidays"), a:has-text("🏖️ My Holidays")').first();
        if (await holidayNav.count() > 0) {
          console.log('✅ Found holiday navigation in staff interface');
          await holidayNav.click();
          await page.waitForTimeout(3000);
          
          await page.screenshot({ path: 'test_staff_holidays_auth.png', fullPage: true });
          console.log('📸 Screenshot saved: test_staff_holidays_auth.png');
          
          // Test request holiday button
          const requestBtn = await page.locator('button:has-text("Request Holiday")').first();
          if (await requestBtn.count() > 0) {
            console.log('✅ Found request holiday button');
            await requestBtn.click();
            await page.waitForTimeout(1000);
            
            const modal = await page.locator('.modal').first();
            if (await modal.isVisible()) {
              console.log('✅ Holiday request modal opened');
              await page.screenshot({ path: 'test_holiday_request_modal_auth.png' });
              console.log('📸 Screenshot saved: test_holiday_request_modal_auth.png');
            }
          }
        } else {
          console.log('❌ Holiday navigation not found in staff interface');
          await page.screenshot({ path: 'test_staff_no_holidays.png', fullPage: true });
        }
      }
      
      // Test admin interface
      console.log('🔧 Testing admin holiday interface...');
      
      // Navigate to admin dashboard  
      await page.goto('http://127.0.0.1:58156/admin-dashboard.html');
      await page.waitForTimeout(3000);
      
      // Look for holiday management navigation
      const adminHolidayNav = await page.locator('button[data-section="holidays-management"]').first();
      if (await adminHolidayNav.count() > 0) {
        console.log('✅ Found holiday management in admin interface');
        await adminHolidayNav.click();
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: 'test_admin_holidays_auth.png', fullPage: true });
        console.log('📸 Screenshot saved: test_admin_holidays_auth.png');
        
        // Test holiday settings
        const settingsBtn = await page.locator('button[data-section="holidays-settings"]').first();
        if (await settingsBtn.count() > 0) {
          await settingsBtn.click();
          await page.waitForTimeout(2000);
          
          await page.screenshot({ path: 'test_admin_holiday_settings_auth.png', fullPage: true });
          console.log('📸 Screenshot saved: test_admin_holiday_settings_auth.png');
        }
        
        // Test holiday calendar
        const calendarBtn = await page.locator('button[data-section="holidays-calendar"]').first();
        if (await calendarBtn.count() > 0) {
          await calendarBtn.click();
          await page.waitForTimeout(2000);
          
          await page.screenshot({ path: 'test_admin_holiday_calendar_auth.png', fullPage: true });
          console.log('📸 Screenshot saved: test_admin_holiday_calendar_auth.png');
        }
      } else {
        console.log('❌ Holiday management not found in admin interface');
        await page.screenshot({ path: 'test_admin_no_holidays.png', fullPage: true });
      }
      
    } else {
      console.log('❌ Login form not found');
      await page.screenshot({ path: 'test_no_login_form.png', fullPage: true });
    }
    
    console.log('🎉 Holiday system testing with auth completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    await page.screenshot({ path: 'test_holiday_auth_error.png', fullPage: true });
  } finally {
    // Keep browser open for 10 seconds to review
    console.log('⏳ Keeping browser open for review...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

// Run the test
testHolidaySystemWithAuth().catch(console.error);