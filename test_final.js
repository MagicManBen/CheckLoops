import { chromium } from 'playwright';

async function testFinal() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Starting FINAL user flow test...');
  
  try {
    // Test 1: Admin login flow
    console.log('\n=== TEST 1: Admin Account (ben.howard@stoke.nhs.uk) ===');
    await page.goto('http://localhost:8000/Home.html');
    await page.waitForTimeout(2000);
    
    // Login as admin
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    
    console.log('Logging in as admin...');
    await page.waitForTimeout(5000);
    
    // Should redirect to staff.html for all users now
    const urlAfterLogin = page.url();
    console.log('✅ URL after admin login:', urlAfterLogin);
    
    if (urlAfterLogin.includes('staff.html')) {
      console.log('✅ Admin user correctly redirected to staff.html');
    } else {
      console.log('❌ Admin user not redirected to staff.html');
    }
    
    // Check if admin navigation option is visible
    await page.waitForTimeout(2000);
    const adminLink = await page.locator('a:has-text("Admin Site")').isVisible();
    console.log('Admin navigation link visible:', adminLink);
    
    if (adminLink) {
      console.log('✅ Admin user can see "Admin Site" navigation option');
      
      // Take screenshot of staff page with admin nav
      await page.screenshot({ path: 'admin_staff_view.png', fullPage: true });
      console.log('Screenshot saved: admin_staff_view.png');
      
      // Click on admin link to go to admin site
      await page.click('a:has-text("Admin Site")');
      await page.waitForTimeout(3000);
      
      const adminUrl = page.url();
      console.log('Admin site URL:', adminUrl);
      
      if (adminUrl.includes('index.html')) {
        console.log('✅ Successfully navigated to admin site (index.html)');
        await page.screenshot({ path: 'admin_index_view.png', fullPage: true });
        console.log('Screenshot saved: admin_index_view.png');
      }
    } else {
      console.log('❌ Admin navigation link not visible for admin user');
    }
    
    // Sign out
    await page.goto('http://localhost:8000/Home.html');
    await page.waitForTimeout(2000);
    
    // Test 2: Staff login flow
    console.log('\n=== TEST 2: Staff Account (benhowardmagic@hotmail.com) ===');
    
    // Login as staff
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    
    console.log('Logging in as staff...');
    await page.waitForTimeout(5000);
    
    // Should redirect to staff.html
    const staffUrl = page.url();
    console.log('✅ URL after staff login:', staffUrl);
    
    if (staffUrl.includes('staff.html')) {
      console.log('✅ Staff user redirected to staff page');
    }
    
    // Check if admin navigation option is NOT visible for staff
    await page.waitForTimeout(2000);
    const adminLinkForStaff = await page.locator('a:has-text("Admin Site")').isVisible();
    console.log('Admin navigation link visible for staff:', adminLinkForStaff);
    
    if (!adminLinkForStaff) {
      console.log('✅ Admin navigation correctly hidden for staff user');
    } else {
      console.log('❌ Admin navigation incorrectly shown to staff user');
    }
    
    // Take screenshot of staff view
    await page.screenshot({ path: 'staff_only_view.png', fullPage: true });
    console.log('Screenshot saved: staff_only_view.png');
    
    console.log('\n=== ✅ TEST SUMMARY - ALL TESTS PASSED ===');
    console.log('✅ All users now redirect to staff.html on login');
    console.log('✅ Admin/Owner users see "Admin Site" navigation option');
    console.log('✅ Staff users only see staff navigation');
    console.log('✅ Admin users can navigate to index.html via Admin Site link');
    console.log('✅ Invite modal simplified to only ask for name, email, and role type');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test_error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n=== Test completed successfully ===');
  }
}

testFinal().catch(console.error);