import { chromium } from 'playwright';

async function testStaffLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('1. Testing staff login flow...');
    
    // Go to homepage
    await page.goto('file:///Users/benhoward/Desktop/CheckLoop/CheckLoops/index.html');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test_1_homepage.png' });
    console.log('   ✓ Homepage loaded');
    
    // Click Staff Login button
    await page.click('button:has-text("Staff Login")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test_2_staff_login.png' });
    console.log('   ✓ Navigated to staff login page');
    
    // Login with test credentials
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.screenshot({ path: 'test_3_credentials_entered.png' });
    
    // Submit login
    await page.click('button[type="submit"]');
    console.log('   ✓ Login submitted, waiting for redirect...');
    await page.waitForTimeout(5000);
    
    // Check if redirected to staff.html
    const currentUrl = page.url();
    await page.screenshot({ path: 'test_4_after_login.png' });
    console.log(`   ✓ Current URL: ${currentUrl}`);
    
    // Check if email is displayed
    const emailText = await page.textContent('body');
    if (emailText.includes('benhowardmagic@hotmail.com')) {
      console.log('   ✓ Email displayed - user is logged in');
    } else if (emailText.includes('User')) {
      console.log('   ✗ Shows "User" - not properly logged in');
    }
    
    // Try navigating to Welcome page
    console.log('2. Testing navigation to Welcome page...');
    const welcomeButton = await page.locator('button:has-text("Welcome")').first();
    if (await welcomeButton.isVisible()) {
      await welcomeButton.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test_5_welcome_page.png' });
      
      // Check if still logged in on Welcome page
      const welcomeText = await page.textContent('body');
      if (welcomeText.includes('benhowardmagic@hotmail.com')) {
        console.log('   ✓ Still logged in on Welcome page');
      } else {
        console.log('   ✗ Lost session on Welcome page');
      }
    }
    
    // Test other navigation items
    console.log('3. Testing navigation to other pages...');
    const navItems = ['My Scans', 'My Training', 'Meetings'];
    for (const item of navItems) {
      try {
        const button = await page.locator(`button:has-text("${item}")`).first();
        if (await button.isVisible()) {
          await button.click();
          await page.waitForTimeout(2000);
          const pageText = await page.textContent('body');
          if (pageText.includes('benhowardmagic@hotmail.com')) {
            console.log(`   ✓ ${item} - session persisted`);
          } else {
            console.log(`   ✗ ${item} - session lost`);
          }
        }
      } catch (e) {
        console.log(`   - ${item} not found`);
      }
    }
    
    // Check that Admin Site button is NOT visible
    console.log('4. Checking admin navigation is removed...');
    const adminButton = await page.locator('button:has-text("Admin Site")').first();
    if (await adminButton.isVisible()) {
      console.log('   ✗ Admin Site button is still visible (should be hidden)');
    } else {
      console.log('   ✓ Admin Site button is not visible (correct)');
    }
    
    console.log('\n✅ Staff login test completed');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test_error.png' });
  } finally {
    await browser.close();
  }
}

testStaffLogin();