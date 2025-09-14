import { chromium } from 'playwright';

async function testAdminLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('1. Testing admin login flow...');
    
    // Go to homepage
    await page.goto('file:///Users/benhoward/Desktop/CheckLoop/CheckLoops/index.html');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'admin_test_1_homepage.png' });
    console.log('   ✓ Homepage loaded');
    
    // Click Admin Login button
    await page.click('button:has-text("Admin Login")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'admin_test_2_admin_login.png' });
    console.log('   ✓ Navigated to admin login page');
    
    // Check for admin-only warning
    const warningText = await page.textContent('body');
    if (warningText.includes('Only users with Owner or Admin roles')) {
      console.log('   ✓ Admin-only warning displayed');
    }
    
    // Login with test credentials
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.screenshot({ path: 'admin_test_3_credentials_entered.png' });
    
    // Submit login
    await page.click('button[type="submit"]');
    console.log('   ✓ Login submitted, waiting for redirect...');
    await page.waitForTimeout(5000);
    
    // Check if redirected to admin-dashboard.html
    const currentUrl = page.url();
    await page.screenshot({ path: 'admin_test_4_after_login.png' });
    console.log(`   ✓ Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('admin-dashboard.html')) {
      console.log('   ✓ Successfully redirected to admin dashboard');
    } else if (currentUrl.includes('staff-welcome.html')) {
      console.log('   ⚠ Redirected to staff welcome (onboarding incomplete)');
    } else if (currentUrl.includes('admin-login.html')) {
      // Check for error message
      const errorMsg = await page.locator('.error-message.show').textContent().catch(() => null);
      if (errorMsg) {
        console.log(`   ✗ Login failed with error: ${errorMsg}`);
      } else {
        console.log('   ✗ Still on login page, no error shown');
      }
    }
    
    // Check if name is displayed (should show "Ben Howard" for admin)
    const bodyText = await page.textContent('body');
    if (bodyText.includes('Ben Howard')) {
      console.log('   ✓ User name "Ben Howard" displayed - admin logged in');
    } else if (bodyText.includes('benhowardmagic@hotmail.com')) {
      console.log('   ✓ Email displayed - user logged in');
    } else if (bodyText.includes('User')) {
      console.log('   ✗ Shows "User" - not properly logged in');
    }
    
    // Test with a staff-only account (if we had one)
    console.log('\n2. Testing staff user rejection...');
    console.log('   (Would need a staff-only test account to verify)');
    
    // Test navigation back to staff login
    console.log('\n3. Testing cross-portal navigation...');
    await page.goto('file:///Users/benhoward/Desktop/CheckLoop/CheckLoops/admin-login.html');
    await page.waitForTimeout(1000);
    await page.click('a:has-text("Go to Staff Login")');
    await page.waitForTimeout(2000);
    if (page.url().includes('home.html')) {
      console.log('   ✓ Successfully navigated to staff login');
    }
    
    console.log('\n✅ Admin login test completed');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'admin_test_error.png' });
  } finally {
    await browser.close();
  }
}

testAdminLogin();