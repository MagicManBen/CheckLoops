import { chromium } from 'playwright';

async function testStaffFlow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Testing STAFF FLOW: homepage → home → staff');
    
    // Step 1: Start at homepage.html
    console.log('📍 Step 1: Navigate to homepage.html');
    await page.goto('http://127.0.0.1:5500/homepage.html');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-flow-1-homepage.png' });
    console.log('✅ On homepage.html');
    
    // Step 2: Click login to go to home.html
    console.log('📍 Step 2: Click Sign In to go to home.html');
    await page.click('button:has-text("Sign In"), a:has-text("Sign In"), .btn.primary');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    if (page.url().includes('home.html')) {
      console.log('✅ Successfully navigated to home.html login page');
      await page.screenshot({ path: 'test-flow-2-login.png' });
    } else {
      console.log('❌ Not on home.html - URL:', page.url());
    }
    
    // Step 3: Login with benhowardmagic@hotmail.com
    console.log('📍 Step 3: Login with benhowardmagic@hotmail.com');
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('#password', 'Hello1!');
    
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Should go to staff.html (regardless of admin role)
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    if (currentUrl.includes('staff.html')) {
      console.log('✅ Successfully redirected to staff.html');
      await page.screenshot({ path: 'test-flow-3-staff-home.png' });
    } else {
      console.log('❌ Not on staff.html after login - URL:', currentUrl);
      await page.screenshot({ path: 'test-flow-3-error.png' });
    }
    
    // Step 4: Verify user details show benhowardmagic@hotmail.com
    console.log('📍 Step 4: Verify user details show correct email');
    
    // Look for email in various places
    const emailElements = await page.locator('text=benhowardmagic@hotmail.com').all();
    const emailVisible = emailElements.length > 0;
    
    console.log('Email visible on staff page:', emailVisible);
    if (emailVisible) {
      console.log('✅ User email correctly displayed');
    }
    
    // Step 5: Test all staff menu pages
    console.log('📍 Step 5: Testing all staff menu navigation');
    
    const staffPages = [
      { button: 'Welcome', expectedUrl: 'staff-welcome.html', name: 'Welcome' },
      { button: 'Meetings', expectedUrl: 'staff-meetings.html', name: 'Meetings' },
      { button: 'My Scans', expectedUrl: 'staff-scans.html', name: 'My Scans' },
      { button: 'My Training', expectedUrl: 'staff-training.html', name: 'My Training' },
      { button: 'Achievements', expectedUrl: 'achievements.html', name: 'Achievements' },
      { button: 'Quiz', expectedUrl: 'staff-quiz.html', name: 'Quiz' },
      { button: 'Home', expectedUrl: 'staff.html', name: 'Home' }
    ];
    
    for (let i = 0; i < staffPages.length; i++) {
      const staffPage = staffPages[i];
      try {
        console.log(`  → Testing ${staffPage.name} navigation`);
        
        // Click the navigation button
        await page.click(`button:has-text("${staffPage.button}")`);
        await page.waitForTimeout(3000);
        await page.waitForLoadState('networkidle');
        
        const url = page.url();
        if (url.includes(staffPage.expectedUrl)) {
          console.log(`  ✅ Successfully navigated to ${staffPage.name}`);
          
          // Take screenshot of each page
          await page.screenshot({ path: `test-flow-4-${i+1}-${staffPage.name.toLowerCase().replace(' ', '-')}.png` });
          
          // Verify user email is still visible (if present on page)
          const emailStillVisible = await page.locator('text=benhowardmagic@hotmail.com').count() > 0;
          if (emailStillVisible) {
            console.log(`    ✅ User email still visible on ${staffPage.name}`);
          } else {
            console.log(`    ℹ️  User email not displayed on ${staffPage.name} (may be normal)`);
          }
          
        } else {
          console.log(`  ⚠️  Navigation to ${staffPage.name} - Expected ${staffPage.expectedUrl}, got ${url}`);
          await page.screenshot({ path: `test-flow-4-${i+1}-${staffPage.name.toLowerCase().replace(' ', '-')}-error.png` });
        }
        
      } catch (error) {
        console.log(`  ❌ Could not navigate to ${staffPage.name}: ${error.message}`);
        await page.screenshot({ path: `test-flow-4-${i+1}-${staffPage.name.toLowerCase().replace(' ', '-')}-fail.png` });
      }
    }
    
    // Step 6: Return to staff home and take final screenshot
    console.log('📍 Step 6: Return to staff home');
    await page.goto('http://127.0.0.1:5500/staff.html');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-flow-final-staff-home.png' });
    
    // Step 7: Verify admin button is visible (should be since benhowardmagic is admin)
    console.log('📍 Step 7: Check admin button visibility');
    const adminButton = await page.locator('button:has-text("Admin Site"), .admin-only').first();
    const adminVisible = await adminButton.isVisible().catch(() => false);
    console.log('Admin Site button visible:', adminVisible);
    
    if (adminVisible) {
      console.log('✅ Admin button correctly visible for admin user');
    }
    
    console.log('🎉 Staff flow test completed successfully!');
    console.log('📸 Screenshots saved in project directory');
    
  } catch (error) {
    console.error('❌ Staff flow test failed:', error.message);
    await page.screenshot({ path: 'test-flow-error.png' });
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testStaffFlow().catch(console.error);