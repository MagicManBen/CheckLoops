import { chromium } from 'playwright';

async function testAuthAndNavigation() {
  console.log('🚀 Starting authentication and navigation test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for visibility
  });
  
  const page = await browser.newPage();
  
  try {
    // Test 1: Navigate to index.html
    console.log('\n📍 Test 1: Loading index.html...');
    await page.goto('http://127.0.0.1:58156/index.html');
    await page.waitForTimeout(2000);
    
    // Check if we're redirected to Home.html (login page)
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('Home.html')) {
      console.log('✅ Correctly redirected to login page');
      
      // Test 2: Perform login
      console.log('\n📍 Test 2: Logging in...');
      await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
      await page.locator('input[type="password"]').fill('Hello1!');
      await page.click('button:has-text("Sign In")');
      
      // Wait for redirect back to index.html
      await page.waitForURL('**/index.html', { timeout: 10000 });
      console.log('✅ Successfully logged in and redirected to admin dashboard');
      
      // Wait for app to initialize
      await page.waitForTimeout(3000);
    }
    
    // Test 3: Check if dashboard is visible
    console.log('\n📍 Test 3: Checking dashboard visibility...');
    const dashboardVisible = await page.locator('#view-dashboard').isVisible();
    console.log('Dashboard visible:', dashboardVisible);
    
    // Test 4: Test navigation to different sections
    console.log('\n📍 Test 4: Testing navigation...');
    
    // Try navigating to Staff section
    const staffButton = page.locator('button[data-section="staff"]');
    if (await staffButton.isVisible()) {
      console.log('Clicking Staff button...');
      await staffButton.click();
      await page.waitForTimeout(2000);
      
      const staffViewVisible = await page.locator('#view-staff').isVisible();
      console.log('Staff view visible:', staffViewVisible);
      
      if (staffViewVisible) {
        console.log('✅ Navigation to Staff section successful');
      } else {
        console.log('❌ Staff section not visible after clicking');
      }
    }
    
    // Try navigating to Rooms section
    const roomsButton = page.locator('button[data-section="rooms"]');
    if (await roomsButton.isVisible()) {
      console.log('Clicking Rooms button...');
      await roomsButton.click();
      await page.waitForTimeout(2000);
      
      const roomsViewVisible = await page.locator('#view-rooms').isVisible();
      console.log('Rooms view visible:', roomsViewVisible);
      
      if (roomsViewVisible) {
        console.log('✅ Navigation to Rooms section successful');
      } else {
        console.log('❌ Rooms section not visible after clicking');
      }
    }
    
    // Navigate back to Dashboard
    const dashboardButton = page.locator('button[data-section="dashboard"]');
    if (await dashboardButton.isVisible()) {
      console.log('Clicking Dashboard button...');
      await dashboardButton.click();
      await page.waitForTimeout(2000);
      
      const dashboardBackVisible = await page.locator('#view-dashboard').isVisible();
      console.log('Dashboard visible again:', dashboardBackVisible);
      
      if (dashboardBackVisible) {
        console.log('✅ Navigation back to Dashboard successful');
      } else {
        console.log('❌ Dashboard not visible after clicking');
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'auth_navigation_test.png', fullPage: true });
    console.log('\n📸 Screenshot saved as auth_navigation_test.png');
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ path: 'auth_navigation_error.png', fullPage: true });
    console.log('Error screenshot saved as auth_navigation_error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthAndNavigation().catch(console.error);