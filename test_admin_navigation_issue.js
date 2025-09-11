import { chromium } from 'playwright';

async function testAdminNavigationIssue() {
  console.log('🧪 Testing admin navigation issue...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Add delay to see what's happening
  });
  const page = await browser.newPage();
  
  // Enable console logging to see what's happening
  page.on('console', msg => {
    console.log(`CONSOLE ${msg.type()}: ${msg.text()}`);
  });
  
  // Track navigation events
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      console.log(`📍 NAVIGATED TO: ${frame.url()}`);
    }
  });
  
  try {
    // Step 1: Navigate to home.html
    console.log('1️⃣ Navigating to home.html...');
    await page.goto('http://127.0.0.1:5500/home.html');
    await page.waitForTimeout(2000);
    
    // Step 2: Login with admin credentials
    console.log('2️⃣ Logging in with admin credentials...');
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    
    // Wait for redirect to staff.html
    console.log('3️⃣ Waiting for redirect to staff.html...');
    await page.waitForURL('**/staff.html', { timeout: 10000 });
    console.log('✅ Successfully redirected to staff.html');
    
    // Step 3: Wait 5 seconds for admin button to appear
    console.log('4️⃣ Waiting 5 seconds for admin button to appear...');
    await page.waitForTimeout(5000);
    
    // Check if admin button is visible
    const adminButton = page.locator('a:has-text("Admin Site")');
    await adminButton.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✅ Admin Site button is visible');
    
    // Step 4: Click the Admin Site button and monitor what happens
    console.log('5️⃣ Clicking Admin Site button...');
    await adminButton.click();
    
    // Monitor for rapid navigation changes
    let navigationCount = 0;
    const startTime = Date.now();
    
    const navigationHandler = () => {
      navigationCount++;
      const currentUrl = page.url();
      const elapsed = Date.now() - startTime;
      console.log(`🔄 Navigation #${navigationCount} at ${elapsed}ms: ${currentUrl}`);
      
      if (navigationCount > 3) {
        console.error('🚨 LOOP DETECTED: Too many navigations in short time!');
      }
    };
    
    page.on('framenavigated', navigationHandler);
    
    // Wait for final destination (or timeout)
    try {
      await page.waitForURL('**/admin.html', { timeout: 10000 });
      console.log('✅ Successfully reached admin.html');
    } catch (e) {
      console.error(`❌ Did not reach admin dashboard. Current URL: ${page.url()}`);
      console.error(`Total navigations: ${navigationCount}`);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'admin_navigation_issue.png' });
      console.log('📸 Screenshot saved as admin_navigation_issue.png');
    }
    
    // Wait a bit more to see any additional behavior
    await page.waitForTimeout(5000);
    console.log(`🏁 Final URL: ${page.url()}`);
    console.log(`📊 Total navigation events: ${navigationCount}`);
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'admin_navigation_error.png' });
    console.log('📸 Error screenshot saved as admin_navigation_error.png');
  } finally {
    await browser.close();
  }
}

testAdminNavigationIssue().catch(console.error);