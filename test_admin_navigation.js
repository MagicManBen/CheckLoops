import { chromium } from 'playwright';

async function testAdminNavigation() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for visibility
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('1. Navigating to staff login page...');
    await page.goto('https://magicmanben.github.io/CheckLoops/staff.html');
    await page.waitForTimeout(2000);
    
    // Check if we need to log in
    const emailField = await page.locator('#email').count();
    if (emailField > 0) {
      console.log('2. Logging in as admin...');
      await page.locator('#email').fill('benhowardmagic@hotmail.com');
      await page.locator('#password').fill('Hello1!');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
    }
    
    // Wait for the page to load and check for admin access panel
    console.log('3. Waiting for admin access panel...');
    await page.waitForSelector('#admin-access-panel', { 
      state: 'visible',
      timeout: 10000 
    });
    
    console.log('4. Admin panel found! Clicking Admin Site button...');
    
    // Get the current URL before clicking
    const urlBefore = page.url();
    console.log('   Current URL:', urlBefore);
    
    // Click the Admin Site button
    await page.click('a.admin-only:has-text("Admin Site")');
    await page.waitForTimeout(3000);
    
    // Check where we ended up
    const urlAfter = page.url();
    console.log('   URL after click:', urlAfter);
    
    // Check if we're on the admin dashboard
    if (urlAfter.includes('admin-dashboard.html')) {
      console.log('✅ SUCCESS: Navigation to admin dashboard worked correctly!');
      
      // Take a screenshot for verification
      await page.screenshot({ path: 'admin_navigation_success.png' });
      console.log('   Screenshot saved as admin_navigation_success.png');
    } else if (urlAfter.includes('staff.html')) {
      console.log('❌ ISSUE CONFIRMED: Redirected back to staff.html instead of admin-dashboard.html');
      
      // Let's check the console for any errors
      page.on('console', msg => console.log('Browser console:', msg.text()));
      
      // Try clicking again with more debugging
      console.log('5. Attempting to debug the issue...');
      
      // Check if the link href is correct
      const linkHref = await page.locator('a.admin-only').getAttribute('href');
      console.log('   Admin link href:', linkHref);
      
      // Check localStorage for auth token
      const authToken = await page.evaluate(() => {
        const keys = Object.keys(localStorage).filter(k => k.includes('supabase'));
        return keys.map(k => ({ key: k, hasValue: !!localStorage.getItem(k) }));
      });
      console.log('   Auth tokens in localStorage:', authToken);
      
      // Try navigating directly to admin-dashboard.html
      console.log('6. Trying direct navigation to admin-dashboard.html...');
      await page.goto('https://magicmanben.github.io/CheckLoops/admin-dashboard.html');
      await page.waitForTimeout(3000);
      
      const finalUrl = page.url();
      console.log('   Final URL:', finalUrl);
      
      if (finalUrl.includes('admin-dashboard.html')) {
        console.log('✅ Direct navigation works! The issue is with the button click handler.');
      } else {
        console.log('❌ Even direct navigation fails. Checking for authentication issues...');
      }
      
      await page.screenshot({ path: 'admin_navigation_debug.png' });
    } else {
      console.log('⚠️ Unexpected navigation to:', urlAfter);
      await page.screenshot({ path: 'admin_navigation_unexpected.png' });
    }
    
  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'admin_navigation_error.png' });
  } finally {
    console.log('\nClosing browser in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testAdminNavigation().catch(console.error);