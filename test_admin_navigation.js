import { chromium } from 'playwright';

async function testAdminNavigation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('Browser console:', msg.text()));
  
  try {
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:5174/home.html');
    await page.waitForTimeout(1000);
    
    console.log('2. Logging in as admin (benhowardmagic@hotmail.com)...');
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation to staff.html
    await page.waitForURL('**/staff.html', { timeout: 10000 });
    console.log('3. Successfully logged in and redirected to staff.html');
    
    // Wait for page to fully load
    await page.waitForTimeout(3000);
    
    // Take screenshot to confirm we're on staff page with admin button
    await page.screenshot({ path: 'admin_button_visible.png', fullPage: true });
    
    // Check if Admin Site button is visible
    const adminButton = page.locator('a:has-text("Admin Site")');
    const isVisible = await adminButton.isVisible();
    console.log(`4. Admin Site button visible: ${isVisible}`);
    
    if (!isVisible) {
      // Try to find any admin-only elements
      const adminElements = await page.locator('.admin-only').count();
      console.log(`   Found ${adminElements} admin-only elements`);
      
      // Check the display style
      if (adminElements > 0) {
        const displayStyle = await page.locator('.admin-only').first().evaluate(el => 
          window.getComputedStyle(el).display
        );
        console.log(`   Admin-only element display style: ${displayStyle}`);
      }
    }
    
    // Click the Admin Site button if visible
    if (isVisible) {
      console.log('5. Clicking Admin Site button...');
      
      // Set up a listener for any navigation
      const navigationPromise = page.waitForLoadState('networkidle');
      
      await adminButton.click();
      
      // Wait a bit to see what happens
      await Promise.race([
        navigationPromise,
        page.waitForTimeout(5000)
      ]);
      
      const currentUrl = page.url();
      console.log(`6. Current URL after click: ${currentUrl}`);
      
      // Take screenshot of where we ended up
      await page.screenshot({ path: 'after_admin_click.png', fullPage: true });
      
      // Check if we're on admin-dashboard
      if (currentUrl.includes('admin-dashboard.html')) {
        console.log('✅ SUCCESS: Navigated to admin dashboard');
      } else if (currentUrl.includes('staff.html')) {
        console.log('❌ ISSUE: Redirected back to staff.html');
        
        // Check console for any errors
        const logs = await page.evaluate(() => {
          const errorLogs = [];
          // Try to capture any console errors
          return errorLogs;
        });
      } else if (currentUrl.includes('home.html')) {
        console.log('❌ ISSUE: Redirected to login page (home.html)');
      } else {
        console.log(`❌ ISSUE: Unexpected redirect to ${currentUrl}`);
      }
    } else {
      console.log('❌ Admin Site button not visible - checking role...');
      
      // Try to check the user's role from the page
      const roleInfo = await page.evaluate(() => {
        // Try to get role from various places
        const roleElement = document.querySelector('[data-role]');
        const roleText = roleElement ? roleElement.textContent : 'Not found';
        
        // Check localStorage/sessionStorage
        const storedRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
        
        return {
          displayedRole: roleText,
          storedRole: storedRole
        };
      });
      
      console.log('Role information:', roleInfo);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test_error.png', fullPage: true });
  } finally {
    console.log('\nTest complete. Check screenshots for visual confirmation.');
    await browser.close();
  }
}

// Run the test
testAdminNavigation().catch(console.error);