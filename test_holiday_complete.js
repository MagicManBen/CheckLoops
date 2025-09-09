import { chromium } from 'playwright';

async function testCompleteHolidaySystem() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('\n=== Testing Complete Holiday System ===\n');
  
  try {
    // 1. TEST ADMIN ACCOUNT
    console.log('1. Testing Admin Account (benhowardmagic@hotmail.com)...');
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.waitForTimeout(2000);
    
    // Login as admin
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    console.log('  - Logged in, current URL:', page.url());
    
    // Check if admin panel is visible
    const adminPanel = page.locator('#admin-access-panel');
    const isAdminPanelVisible = await adminPanel.isVisible();
    console.log('  - Admin access panel visible?', isAdminPanelVisible);
    
    if (isAdminPanelVisible) {
      // Try to navigate to admin dashboard
      const adminLink = page.locator('a[href="admin-dashboard.html"]');
      await adminLink.click();
      await page.waitForTimeout(3000);
      
      if (page.url().includes('admin-dashboard.html')) {
        console.log('  ✅ Successfully navigated to admin dashboard!');
        
        // Check holiday management sections
        const holidayToggle = page.locator('#toggle-holidays');
        if (await holidayToggle.isVisible()) {
          await holidayToggle.click();
          await page.waitForTimeout(1000);
          
          // Check holiday management buttons
          const holidayManagement = page.locator('button[data-section="holidays-management"]');
          const holidayCalendar = page.locator('button[data-section="holidays-calendar"]');
          const holidaySettings = page.locator('button[data-section="holidays-settings"]');
          
          console.log('  - Holiday management visible?', await holidayManagement.isVisible());
          console.log('  - Holiday calendar visible?', await holidayCalendar.isVisible());
          console.log('  - Holiday settings visible?', await holidaySettings.isVisible());
          
          // Click on holiday management
          if (await holidayManagement.isVisible()) {
            await holidayManagement.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'test_admin_holidays.png' });
            console.log('  - Admin holiday management screenshot saved');
          }
        }
      } else {
        console.log('  ❌ Failed to navigate to admin dashboard');
      }
    } else {
      console.log('  ❌ Admin panel not visible - checking role...');
      
      // Debug: Check what role is being detected
      const roleInfo = await page.evaluate(() => {
        const rolePill = document.getElementById('role-pill');
        return rolePill ? rolePill.textContent : 'Role pill not found';
      });
      console.log('  - Role displayed:', roleInfo);
    }
    
    // 2. TEST STAFF ACCOUNT
    console.log('\n2. Testing Staff Account (ben.howard@stoke.nhs.uk)...');
    
    // Logout first
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.waitForTimeout(2000);
    
    // Login as staff
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    console.log('  - Logged in as staff, current URL:', page.url());
    
    // Navigate to holidays page
    await page.goto('http://127.0.0.1:58156/staff-holidays.html');
    await page.waitForTimeout(3000);
    
    // Check page loaded properly
    const holidayTitle = await page.textContent('h1');
    console.log('  - Holiday page title:', holidayTitle);
    
    // Check button styling
    const requestButton = page.locator('button:has-text("Request Holiday")');
    if (await requestButton.isVisible()) {
      const buttonStyles = await requestButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          background: styles.backgroundColor,
          color: styles.color,
          visibility: styles.visibility
        };
      });
      console.log('  - Request Holiday button styles:', buttonStyles);
      
      // Check if button is properly visible (not white on white)
      if (buttonStyles.color !== 'rgb(255, 255, 255)' || 
          buttonStyles.background.includes('gradient')) {
        console.log('  ✅ Button styling fixed!');
      } else {
        console.log('  ⚠️ Button might still have visibility issues');
      }
    }
    
    // Check holiday countdown section
    const countdownSection = page.locator('#countdown-section');
    const isCountdownVisible = await countdownSection.isVisible();
    console.log('  - Holiday countdown visible?', isCountdownVisible);
    
    if (isCountdownVisible) {
      const destination = await page.locator('#countdown-destination').textContent();
      const timer = await page.locator('#countdown-timer').textContent();
      console.log('  - Countdown destination:', destination);
      console.log('  - Countdown timer:', timer);
      
      // Check for avatar image
      const avatarImage = page.locator('#holiday-avatar-image img');
      const hasAvatar = await avatarImage.count() > 0;
      console.log('  - Holiday avatar image present?', hasAvatar);
    }
    
    // Test requesting a holiday
    console.log('\n3. Testing Holiday Request Form...');
    await requestButton.click();
    await page.waitForTimeout(1000);
    
    const modal = page.locator('#request-modal');
    const isModalVisible = await modal.isVisible();
    console.log('  - Request modal opened?', isModalVisible);
    
    if (isModalVisible) {
      // Fill in holiday request
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      await page.locator('#start-date').fill(tomorrow.toISOString().split('T')[0]);
      await page.locator('#end-date').fill(nextWeek.toISOString().split('T')[0]);
      await page.locator('#request-type').selectOption('holiday');
      await page.locator('#destination').fill('Test Destination - Maldives');
      
      // Take screenshot before submitting
      await page.screenshot({ path: 'test_holiday_request_form.png', fullPage: true });
      console.log('  - Holiday request form screenshot saved');
      
      // Close modal without submitting (to not pollute database)
      await page.locator('#holiday-request-form button:has-text("Cancel")').click();
      console.log('  - Modal closed successfully');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test_staff_holidays_final.png', fullPage: true });
    console.log('  - Final staff holidays page screenshot saved');
    
  } catch (error) {
    console.error('Error during testing:', error);
    await page.screenshot({ path: 'test_error_screenshot.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n=== Test Complete ===\n');
    console.log('Screenshots saved:');
    console.log('  - test_admin_holidays.png');
    console.log('  - test_holiday_request_form.png');
    console.log('  - test_staff_holidays_final.png');
  }
}

testCompleteHolidaySystem().catch(console.error);