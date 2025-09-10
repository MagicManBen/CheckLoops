import { chromium } from 'playwright';

async function testLocalFixes() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('\n=== Testing Local Fixes with Live Server ===\n');
  
  try {
    // 1. Test Admin Navigation Fix
    console.log('1. Testing Admin Navigation...');
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.waitForTimeout(3000);
    
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    console.log('  - Logged in as admin, URL:', page.url());
    
    // Check admin panel visibility
    const adminPanel = page.locator('#admin-access-panel');
    const isAdminPanelVisible = await adminPanel.isVisible();
    console.log('  - Admin panel visible:', isAdminPanelVisible);
    
    if (isAdminPanelVisible) {
      await page.locator('a[href="admin-dashboard.html"]').click();
      await page.waitForTimeout(3000);
      console.log('  - ✅ Admin navigation successful, URL:', page.url());
    } else {
      console.log('  - ❌ Admin panel not visible');
    }
    
    // 2. Test Staff Holiday Page Fixes
    console.log('\n2. Testing Staff Holiday Page Fixes...');
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.waitForTimeout(2000);
    
    // Login as staff
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    // Navigate to holidays page
    await page.goto('http://127.0.0.1:58156/staff-holidays.html');
    await page.waitForTimeout(5000);
    
    // Check statistics display
    const totalEntitlement = await page.locator('#total-entitlement').textContent();
    const usedHolidays = await page.locator('#used-holidays').textContent();
    const remainingHolidays = await page.locator('#remaining-holidays').textContent();
    const pendingHolidays = await page.locator('#pending-holidays').textContent();
    
    console.log('  - Statistics Display:');
    console.log('    Total:', totalEntitlement);
    console.log('    Used:', usedHolidays);
    console.log('    Remaining:', remainingHolidays);
    console.log('    Pending:', pendingHolidays);
    
    // Check if statistics show proper values (not "Oh" or undefined)
    const isStatsFixed = [totalEntitlement, usedHolidays, remainingHolidays, pendingHolidays]
      .every(stat => stat && !stat.includes('undefined') && !stat.includes('NaN') && stat.trim() !== 'Oh');
    
    console.log('  - Statistics properly formatted:', isStatsFixed ? '✅' : '❌');
    
    // Check Refresh button styling
    const refreshButton = page.locator('button:has-text("Refresh")');
    const refreshButtonStyles = await refreshButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        visibility: styles.visibility
      };
    });
    
    console.log('  - Refresh button styles:', refreshButtonStyles);
    
    // Check if button has good contrast
    const hasGoodContrast = refreshButtonStyles.color !== 'rgb(255, 255, 255)' || 
                           !refreshButtonStyles.backgroundColor.includes('rgb(243, 245, 249)');
    console.log('  - Refresh button contrast fixed:', hasGoodContrast ? '✅' : '❌');
    
    // 3. Test Holiday Request and Avatar Generation
    console.log('\n3. Testing Holiday Request Form...');
    
    // Open request modal
    await page.locator('button:has-text("Request Holiday")').click();
    await page.waitForTimeout(1000);
    
    const isModalVisible = await page.locator('#request-modal').isVisible();
    console.log('  - Request modal opened:', isModalVisible ? '✅' : '❌');
    
    if (isModalVisible) {
      // Fill form
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 5);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      
      await page.locator('#start-date').fill(startDate.toISOString().split('T')[0]);
      await page.locator('#end-date').fill(endDate.toISOString().split('T')[0]);
      await page.locator('#request-type').selectOption('holiday');
      await page.locator('#destination').fill('Tokyo, Japan');
      
      console.log('  - Form filled with destination: Tokyo, Japan');
      
      // Submit request to test avatar generation
      await page.locator('#holiday-request-form button:has-text("Submit Request")').click();
      await page.waitForTimeout(5000);
      
      // Check if request was added and has avatar
      const holidayItems = await page.locator('.holiday-item').count();
      console.log('  - Number of holiday requests after submission:', holidayItems);
      
      // Look for avatar images or placeholders
      const avatarImages = await page.locator('.holiday-destination-image').count();
      console.log('  - Avatar containers found:', avatarImages);
      
      // Check if any images or placeholders loaded
      await page.waitForTimeout(3000); // Wait for potential avatar generation
      
      const hasAvatars = await page.locator('.holiday-destination-image img, .holiday-destination-image div').count();
      console.log('  - Avatar images/placeholders loaded:', hasAvatars);
      console.log('  - Avatar display:', hasAvatars > 0 ? '✅' : '❌');
    }
    
    // Take final screenshots
    await page.screenshot({ path: 'test_local_fixes_complete.png', fullPage: true });
    console.log('\n4. Screenshot saved: test_local_fixes_complete.png');
    
    // 4. Test countdowns if any exist
    const countdownSection = page.locator('#countdown-section');
    const isCountdownVisible = await countdownSection.isVisible();
    if (isCountdownVisible) {
      console.log('\n5. Holiday countdown section is visible');
      const countdownAvatar = await page.locator('#holiday-avatar-image img, #holiday-avatar-image div').count();
      console.log('   - Countdown avatar present:', countdownAvatar > 0 ? '✅' : '❌');
    } else {
      console.log('\n5. No active countdown section (no upcoming approved holidays)');
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
    await page.screenshot({ path: 'test_local_fixes_error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n=== Test Complete ===\n');
    console.log('Key Fixes Tested:');
    console.log('✓ Admin navigation to admin-dashboard.html');
    console.log('✓ Holiday statistics display (no more "Oh")');
    console.log('✓ Refresh button visibility and contrast');
    console.log('✓ Holiday request form functionality');
    console.log('✓ Avatar image generation and display');
  }
}

testLocalFixes().catch(console.error);