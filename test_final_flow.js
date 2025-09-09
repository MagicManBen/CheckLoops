import { chromium } from 'playwright';

async function testFinalFlow() {
  console.log('🎯 Testing Final Holiday Flow...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Login first
    console.log('🔐 Logging in...');
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!'); // Use the specific ID
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForTimeout(3000);
    
    console.log('✅ Logged in, now on:', page.url());
    await page.screenshot({ path: 'final_1_logged_in.png', fullPage: true });
    
    // Test staff holiday navigation
    console.log('🏖️ Testing staff holiday navigation...');
    const holidayNav = await page.locator('a:has-text("My Holidays")').first();
    
    if (await holidayNav.count() > 0) {
      console.log('✅ Found "My Holidays" navigation');
      await holidayNav.click();
      await page.waitForTimeout(3000);
      
      console.log('📍 Holiday page URL:', page.url());
      await page.screenshot({ path: 'final_2_staff_holidays.png', fullPage: true });
      
      // Check if the page loaded properly by looking for specific holiday elements
      const entitlementSection = await page.locator('text=Holiday Entitlements').first();
      const requestBtn = await page.locator('button:has-text("Request Holiday")').first();
      
      if (await entitlementSection.count() > 0) {
        console.log('✅ Holiday entitlements section found');
      }
      
      if (await requestBtn.count() > 0) {
        console.log('✅ Found "Request Holiday" button');
        await requestBtn.click();
        await page.waitForTimeout(1000);
        
        const modal = await page.locator('.modal').first();
        if (await modal.isVisible()) {
          console.log('✅ Holiday request modal opened');
          await page.screenshot({ path: 'final_3_holiday_modal.png' });
          
          // Close modal
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
        }
      }
    } else {
      console.log('❌ "My Holidays" navigation not found');
      // Let's see what navigation is available
      const navLinks = await page.locator('.nav a, nav a').all();
      console.log('🔍 Available navigation:');
      for (let link of navLinks.slice(0, 10)) {
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        console.log(`  - "${text}" → ${href}`);
      }
    }
    
    // Go back to staff page to find admin button
    await page.goto('http://127.0.0.1:58156/staff.html');
    await page.waitForTimeout(2000);
    
    // Test admin access
    console.log('🔧 Testing admin access...');
    const adminBtn = await page.locator('a:has-text("Admin Site"), button:has-text("Admin Site")').first();
    
    if (await adminBtn.count() > 0) {
      console.log('✅ Found "Admin Site" button');
      
      // Get the href to see where it should go
      const href = await adminBtn.getAttribute('href');
      console.log('🔗 Admin button href:', href);
      
      await adminBtn.click();
      await page.waitForTimeout(5000);
      
      console.log('📍 Admin URL:', page.url());
      await page.screenshot({ path: 'final_4_admin_page.png', fullPage: true });
      
      // If we're still on staff page, there might be a redirect issue
      if (page.url().includes('staff.html')) {
        console.log('⚠️ Still on staff page after clicking admin button');
        
        // Try navigating directly to admin pages
        console.log('🔄 Trying direct navigation to admin-dashboard.html...');
        await page.goto('http://127.0.0.1:58156/admin-dashboard.html');
        await page.waitForTimeout(3000);
        
        console.log('📍 Direct admin URL:', page.url());
        await page.screenshot({ path: 'final_5_direct_admin.png', fullPage: true });
      }
      
      // Look for holiday management in admin (regardless of how we got here)
      const holidayMgmtBtn = await page.locator('button[data-section="holidays-management"]').first();
      
      if (await holidayMgmtBtn.count() > 0) {
        console.log('✅ Found holiday management in admin');
        await holidayMgmtBtn.click();
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: 'final_6_admin_holidays.png', fullPage: true });
        
        // Test holiday settings
        const settingsBtn = await page.locator('button[data-section="holidays-settings"]').first();
        if (await settingsBtn.count() > 0) {
          console.log('✅ Found holiday settings');
          await settingsBtn.click();
          await page.waitForTimeout(2000);
          
          await page.screenshot({ path: 'final_7_holiday_settings.png', fullPage: true });
        }
        
      } else {
        console.log('❌ Holiday management not found in admin');
        await page.screenshot({ path: 'final_6_no_holiday_mgmt.png', fullPage: true });
        
        // Show what navigation is available
        const navButtons = await page.locator('.nav button[data-section], button[data-section]').all();
        console.log('🔍 Available admin sections:');
        for (let btn of navButtons.slice(0, 15)) {
          const text = await btn.textContent();
          const section = await btn.getAttribute('data-section');
          console.log(`  - ${section}: ${text?.trim()}`);
        }
      }
      
    } else {
      console.log('❌ "Admin Site" button not found');
      await page.screenshot({ path: 'final_4_no_admin_btn.png', fullPage: true });
    }
    
    console.log('🎉 Final flow test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: 'final_error.png', fullPage: true });
  } finally {
    console.log('⏳ Keeping browser open for review...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

testFinalFlow().catch(console.error);