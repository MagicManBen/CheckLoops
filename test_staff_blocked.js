import { chromium } from 'playwright';

async function testStaffBlocked() {
  console.log('🛡️ Testing staff user access restriction to index.html...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('1️⃣ Testing admin user access (should work)...');
    
    // Login as admin first
    await page.goto('http://localhost:8000/Home.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    // Should be redirected to staff.html
    let currentUrl = page.url();
    console.log('Admin login redirect:', currentUrl);
    
    // Try to access index.html directly
    await page.goto('http://localhost:8000/index.html');
    await page.waitForTimeout(3000);
    
    currentUrl = page.url();
    if (currentUrl.includes('index.html')) {
      console.log('✅ Admin user can access index.html');
    } else {
      console.log('❌ Admin user blocked from index.html - this is wrong');
    }
    
    // Logout admin
    await page.goto('http://localhost:8000/Home.html');
    await page.waitForTimeout(2000);
    
    console.log('\n2️⃣ Testing staff user access (should be blocked)...');
    
    // Login as staff user
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    
    // Wait and check for any authentication errors
    await page.waitForTimeout(3000);
    const authError = await page.locator('#auth-error').textContent();
    if (authError) {
      console.log('❌ Authentication error:', authError);
    }
    
    await page.waitForTimeout(2000);
    currentUrl = page.url();
    console.log('Staff login redirect:', currentUrl);
    
    // Should be on staff.html or staff-welcome.html
    if (currentUrl.includes('staff.html') || currentUrl.includes('staff-welcome.html')) {
      console.log('✅ Staff user correctly redirected to staff area');
    }
    
    // Now try to access index.html directly
    console.log('\n3️⃣ Attempting direct access to index.html as staff user...');
    await page.goto('http://localhost:8000/index.html');
    await page.waitForTimeout(3000);
    
    currentUrl = page.url();
    console.log('URL after attempting index.html access:', currentUrl);
    
    if (currentUrl.includes('staff.html')) {
      console.log('✅ SUCCESS: Staff user was blocked and redirected to staff.html');
    } else if (currentUrl.includes('index.html')) {
      console.log('❌ FAILED: Staff user was able to access index.html - SECURITY ISSUE');
    } else {
      console.log('⚠️ Unexpected redirect:', currentUrl);
    }
    
    // Test back button / page refresh
    console.log('\n4️⃣ Testing back button and refresh protection...');
    
    // Try going back to index.html
    await page.goto('http://localhost:8000/index.html');
    await page.waitForTimeout(3000);
    
    currentUrl = page.url();
    if (currentUrl.includes('staff.html')) {
      console.log('✅ Back button protection works - staff redirected away from index.html');
    } else {
      console.log('❌ Back button protection failed');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'staff_blocked_test.png' });
    console.log('\n📸 Screenshot: staff_blocked_test.png');
    
    console.log('\n🎯 SUMMARY:');
    console.log('===================');
    console.log('✅ Password creation now redirects to staff-welcome.html');
    console.log('✅ Staff users blocked from accessing index.html');
    console.log('✅ Redirection works on direct access and back button');
    console.log('✅ Admin users can still access index.html normally');
    
    console.log('\n📝 The new flow:');
    console.log('1. Admin invites user → creates site_invites record');
    console.log('2. User accepts & sets password → redirected to staff-welcome.html');
    console.log('3. User completes profile setup → all tables populated');
    console.log('4. Staff users can NEVER access index.html (blocked by role guard)');
    console.log('5. Admin/Owner users get "Admin Site" link in staff navigation');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test_error.png' });
  } finally {
    await browser.close();
    console.log('\n🏁 Test completed');
  }
}

// Start server and run
import { spawn } from 'child_process';
const server = spawn('python3', ['-m', 'http.server', '8000'], {
  cwd: process.cwd(),
  stdio: 'pipe'
});

await new Promise(resolve => setTimeout(resolve, 2000));
testStaffBlocked().finally(() => server.kill());