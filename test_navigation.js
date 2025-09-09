import { chromium } from 'playwright';

async function testNavigation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('=== TESTING NAVIGATION FLOW ===\n');
    
    // Test 1: Root redirects to homepage.html
    console.log('1. Testing root redirect...');
    await page.goto('http://127.0.0.1:58156/');
    await page.waitForTimeout(2000);
    let currentUrl = page.url();
    console.log('   Root (/) redirected to:', currentUrl);
    console.log('   ✓ Should be homepage.html:', currentUrl.includes('homepage.html'));
    
    // Test 2: Homepage redirects logged-in users to staff.html
    console.log('\n2. Testing homepage behavior...');
    await page.goto('http://127.0.0.1:58156/homepage.html');
    await page.waitForTimeout(2000);
    currentUrl = page.url();
    console.log('   Homepage URL:', currentUrl);
    
    // Check if Sign In button exists
    const signInBtn = await page.locator('button:has-text("Sign In")').first();
    if (await signInBtn.count() > 0) {
      console.log('   ✓ Sign In button found - user not logged in');
      
      // Click Sign In to go to Home.html
      await signInBtn.click();
      await page.waitForTimeout(2000);
      currentUrl = page.url();
      console.log('   Clicked Sign In, now at:', currentUrl);
      console.log('   ✓ Should be Home.html:', currentUrl.includes('Home.html'));
    }
    
    // Test 3: Login and check redirect
    console.log('\n3. Testing login flow...');
    if (page.url().includes('Home.html')) {
      // Check remember me functionality
      const rememberCheckbox = await page.locator('#remember-me');
      const emailField = await page.locator('#email');
      const passwordField = await page.locator('#password');
      
      // Check if fields are pre-filled
      const emailValue = await emailField.inputValue();
      const passwordValue = await passwordField.inputValue();
      
      if (emailValue) {
        console.log('   ✓ Email field pre-filled (Remember Me working)');
      }
      
      // Login
      await emailField.fill('benhowardmagic@hotmail.com');
      await passwordField.fill('Hello1!');
      await rememberCheckbox.check();
      console.log('   ✓ Remember Me checked');
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
      
      currentUrl = page.url();
      console.log('   After login, redirected to:', currentUrl);
      console.log('   ✓ Should be staff.html:', currentUrl.includes('staff.html') || currentUrl.includes('staff-welcome.html'));
    }
    
    // Test 4: Staff page navigation
    console.log('\n4. Testing staff page...');
    if (page.url().includes('staff')) {
      // Check if admin panel is visible
      const adminPanel = await page.locator('#admin-access-panel');
      if (await adminPanel.isVisible()) {
        console.log('   ✓ Admin panel visible for admin user');
        
        // Check admin button
        const adminBtn = await page.locator('a:has-text("Admin Site")');
        if (await adminBtn.count() > 0) {
          const adminHref = await adminBtn.getAttribute('href');
          console.log('   Admin button href:', adminHref);
          console.log('   ✓ Points to admin-dashboard.html:', adminHref.includes('admin-dashboard.html'));
        }
      }
      
      // Test Quiz navigation
      const quizBtn = await page.locator('a[href="staff-quiz.html"], button:has-text("Quiz")');
      if (await quizBtn.count() > 0) {
        console.log('   ✓ Quiz button found');
        await quizBtn.first().click();
        await page.waitForTimeout(3000);
        currentUrl = page.url();
        console.log('   Quiz page URL:', currentUrl);
        console.log('   ✓ Navigated to quiz:', currentUrl.includes('quiz'));
      }
    }
    
    // Test 5: Logout flow
    console.log('\n5. Testing logout...');
    const logoutBtn = await page.locator('#logout-btn, button:has-text("Sign Out")').first();
    if (await logoutBtn.count() > 0) {
      await logoutBtn.click();
      await page.waitForTimeout(3000);
      currentUrl = page.url();
      console.log('   After logout, redirected to:', currentUrl);
      console.log('   ✓ Should be Home.html:', currentUrl.includes('Home.html'));
    }
    
    // Test 6: Check remember me after logout
    console.log('\n6. Testing Remember Me persistence...');
    if (page.url().includes('Home.html')) {
      const emailField = await page.locator('#email');
      const passwordField = await page.locator('#password');
      const rememberCheckbox = await page.locator('#remember-me');
      
      const emailValue = await emailField.inputValue();
      const passwordValue = await passwordField.inputValue();
      const isChecked = await rememberCheckbox.isChecked();
      
      console.log('   Email preserved:', emailValue ? '✓' : '✗');
      console.log('   Password preserved:', passwordValue ? '✓' : '✗');
      console.log('   Remember Me checked:', isChecked ? '✓' : '✗');
    }
    
    console.log('\n=== NAVIGATION TEST COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\nKeeping browser open for inspection...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testNavigation();