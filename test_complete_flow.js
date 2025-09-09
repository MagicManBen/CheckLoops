import { chromium } from 'playwright';

async function testCompleteFlow() {
  console.log('🎯 Testing Complete Holiday Flow...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Login first
    console.log('🔐 Logging in...');
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('input[type="password"]').fill('Hello1!');
    await page.locator('button:has-text("Sign In")').click();
    await page.waitForTimeout(3000);
    
    console.log('✅ Logged in, now on:', page.url());
    await page.screenshot({ path: 'flow_1_logged_in.png', fullPage: true });
    
    // Test staff holiday navigation
    console.log('🏖️ Testing staff holiday navigation...');
    const holidayNav = await page.locator('a:has-text("My Holidays")').first();
    
    if (await holidayNav.count() > 0) {
      console.log('✅ Found "My Holidays" navigation');
      await holidayNav.click();
      await page.waitForTimeout(3000);
      
      console.log('📍 Holiday page URL:', page.url());
      await page.screenshot({ path: 'flow_2_staff_holidays.png', fullPage: true });
      
      // Test holiday request button
      const requestBtn = await page.locator('button:has-text("Request Holiday")').first();
      if (await requestBtn.count() > 0) {
        console.log('✅ Found "Request Holiday" button');
        await requestBtn.click();
        await page.waitForTimeout(1000);
        
        const modal = await page.locator('.modal').first();
        if (await modal.isVisible()) {
          console.log('✅ Holiday request modal opened');
          await page.screenshot({ path: 'flow_3_holiday_modal.png' });
          
          // Close modal
          await page.locator('button:has-text("Cancel")').click();
          await page.waitForTimeout(500);
        }
      }
    } else {
      console.log('❌ "My Holidays" navigation not found');
    }
    
    // Test admin access
    console.log('🔧 Testing admin access...');
    const adminBtn = await page.locator('a:has-text("Admin Site"), button:has-text("Admin Site")').first();
    
    if (await adminBtn.count() > 0) {
      console.log('✅ Found "Admin Site" button');
      await adminBtn.click();
      await page.waitForTimeout(5000);
      
      console.log('📍 Admin URL:', page.url());
      await page.screenshot({ path: 'flow_4_admin_page.png', fullPage: true });
      
      // Look for holiday management in admin
      if (page.url().includes('admin') || page.url().includes('index.html')) {
        const holidayMgmtBtn = await page.locator('button[data-section="holidays-management"]').first();
        
        if (await holidayMgmtBtn.count() > 0) {
          console.log('✅ Found holiday management in admin');
          await holidayMgmtBtn.click();
          await page.waitForTimeout(3000);
          
          await page.screenshot({ path: 'flow_5_admin_holidays.png', fullPage: true });
          
          // Test holiday settings
          const settingsBtn = await page.locator('button[data-section="holidays-settings"]').first();
          if (await settingsBtn.count() > 0) {
            console.log('✅ Found holiday settings');
            await settingsBtn.click();
            await page.waitForTimeout(2000);
            
            await page.screenshot({ path: 'flow_6_holiday_settings.png', fullPage: true });
          }
          
        } else {
          console.log('❌ Holiday management not found in admin');
          await page.screenshot({ path: 'flow_5_no_holiday_mgmt.png', fullPage: true });
          
          // Show what navigation is available
          const navButtons = await page.locator('.nav button[data-section]').all();
          console.log('🔍 Available admin sections:');
          for (let btn of navButtons) {
            const text = await btn.textContent();
            const section = await btn.getAttribute('data-section');
            console.log(`  - ${section}: ${text}`);
          }
        }
      } else {
        console.log('❌ Admin button did not navigate to admin area');
        console.log('📍 Ended up on:', page.url());
      }
      
    } else {
      console.log('❌ "Admin Site" button not found');
    }
    
    console.log('🎉 Flow test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: 'flow_error.png', fullPage: true });
  } finally {
    console.log('⏳ Keeping browser open for review...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testCompleteFlow().catch(console.error);