import { chromium } from 'playwright';

async function testHomeLogin() {
  console.log('🏠 Testing Home.html login...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Try Home.html instead
    console.log('🔐 Going to Home.html...');
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test_home_1.png', fullPage: true });
    console.log('📸 Screenshot: test_home_1.png');
    
    // Find login elements
    const emailInput = await page.locator('input[type="email"], #email, input[name="email"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button:has-text("Sign In"), button:has-text("Login"), input[type="submit"]').first();
    
    console.log('Email input count:', await emailInput.count());
    console.log('Password input count:', await passwordInput.count());
    console.log('Login button count:', await loginButton.count());
    
    if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await loginButton.count() > 0) {
      console.log('✅ Found all login elements on Home.html');
      
      await emailInput.fill('ben.howard@stoke.nhs.uk');
      await passwordInput.fill('Hello1!');
      await loginButton.click();
      await page.waitForTimeout(5000);
      
      console.log('📍 URL after login:', page.url());
      await page.screenshot({ path: 'test_home_2_logged_in.png', fullPage: true });
      
      // Now look for admin navigation or admin button
      const adminElements = await page.locator('*:has-text("Admin")').all();
      console.log(`Found ${adminElements.length} elements with "Admin" text`);
      
      for (let i = 0; i < adminElements.length; i++) {
        const element = adminElements[i];
        const tagName = await element.evaluate(el => el.tagName);
        const text = await element.textContent();
        const href = await element.getAttribute('href');
        console.log(`  ${i+1}. <${tagName}> "${text}" href="${href}"`);
      }
      
      // Try clicking the first admin link/button
      const firstAdmin = await page.locator('a:has-text("Admin"), button:has-text("Admin")').first();
      if (await firstAdmin.count() > 0) {
        console.log('✅ Found admin element, clicking...');
        await firstAdmin.click();
        await page.waitForTimeout(3000);
        
        console.log('📍 URL after admin click:', page.url());
        await page.screenshot({ path: 'test_home_3_admin_area.png', fullPage: true });
        
        // Check if holiday navigation exists
        const holidayNav = await page.locator('button[data-section="holidays-management"], *:has-text("Holiday")').first();
        if (await holidayNav.count() > 0) {
          console.log('✅ Found holiday navigation!');
          await holidayNav.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'test_home_4_holidays.png', fullPage: true });
        } else {
          console.log('❌ No holiday navigation found');
        }
      }
      
    } else {
      console.log('❌ Login elements not found on Home.html');
      
      // Let's try staff.html directly
      console.log('🔄 Trying staff.html directly...');
      await page.goto('http://127.0.0.1:58156/staff.html');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test_staff_direct.png', fullPage: true });
      
      // Look for holiday navigation on staff page
      const staffHolidayNav = await page.locator('a:has-text("Holiday"), a:has-text("🏖️")').first();
      if (await staffHolidayNav.count() > 0) {
        console.log('✅ Found holiday nav on staff page');
        await staffHolidayNav.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test_staff_holidays.png', fullPage: true });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: 'test_home_error.png', fullPage: true });
  } finally {
    console.log('⏳ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testHomeLogin().catch(console.error);