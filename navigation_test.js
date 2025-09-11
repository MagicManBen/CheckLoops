import { chromium } from 'playwright';

async function testNavigationFunctionality() {
  console.log('🚀 Starting navigation functionality test...');
  
  const browser = await chromium.launch({ 
    headless: false, // Keep browser visible to observe behavior
    slowMo: 500     // Slow down actions to observe clicking behavior
  });
  
  const page = await browser.newPage();
  
  try {
    // Login to the application
    console.log('📱 Navigating to login page...');
    await page.goto('http://127.0.0.1:58156/index.html');
    await page.waitForTimeout(2000);
    
    console.log('🔐 Logging in...');
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('input[type="password"]').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000); // Wait for login redirect
    
    // Take screenshot of main page after login
    await page.screenshot({ path: 'navigation_test_1_logged_in.png' });
    console.log('📸 Screenshot saved: navigation_test_1_logged_in.png');
    
    // Wait for navigation to be rendered
    await page.waitForSelector('.nav.seg-nav', { timeout: 10000 });
    console.log('✅ Navigation container found');
    
    // Get all navigation links
    const navLinks = await page.locator('.nav.seg-nav a').all();
    console.log(`🔗 Found ${navLinks.length} navigation links`);
    
    // Test clicking each navigation link multiple times
    for (let i = 0; i < navLinks.length; i++) {
      const link = navLinks[i];
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      
      // Skip admin links that might not be visible for testing
      if (text?.includes('Admin') || href?.includes('admin-check')) {
        console.log(`⏭️  Skipping admin link: ${text}`);
        continue;
      }
      
      console.log(`\n🧪 Testing navigation link: "${text}" (${href})`);
      
      // Test multiple rapid clicks to see if there are timing issues
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`  📍 Click attempt ${attempt}/3`);
        
        try {
          // Check if link is clickable
          const isVisible = await link.isVisible();
          const isEnabled = await link.isEnabled();
          
          console.log(`    Visible: ${isVisible}, Enabled: ${isEnabled}`);
          
          if (!isVisible || !isEnabled) {
            console.log(`    ❌ Link not clickable (visible: ${isVisible}, enabled: ${isEnabled})`);
            continue;
          }
          
          // Try clicking
          await link.click({ timeout: 5000 });
          await page.waitForTimeout(2000);
          
          // Check if navigation was successful
          const currentUrl = page.url();
          console.log(`    ✅ Click successful, current URL: ${currentUrl}`);
          
          // Take screenshot
          await page.screenshot({ path: `navigation_test_${i}_${attempt}_${text?.replace(/\s+/g, '_')}.png` });
          
          // Go back to main page for next test
          if (!currentUrl.includes('staff.html')) {
            console.log('    🔄 Navigating back to main staff page...');
            await page.goto('http://127.0.0.1:58156/staff.html');
            await page.waitForTimeout(2000);
          }
          
        } catch (error) {
          console.log(`    ❌ Click failed: ${error.message}`);
          
          // Take error screenshot
          await page.screenshot({ path: `navigation_test_ERROR_${i}_${attempt}.png` });
        }
        
        // Small delay between attempts
        await page.waitForTimeout(1000);
      }
    }
    
    // Test for any JavaScript errors
    const jsErrors = [];
    page.on('pageerror', (error) => {
      jsErrors.push(error.message);
    });
    
    if (jsErrors.length > 0) {
      console.log('\n❌ JavaScript errors detected:');
      jsErrors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('\n✅ No JavaScript errors detected');
    }
    
    // Test event handler conflicts by checking for multiple event listeners
    const eventListenerCount = await page.evaluate(() => {
      const navLinks = document.querySelectorAll('.nav.seg-nav a');
      return Array.from(navLinks).map(link => {
        const events = getEventListeners ? getEventListeners(link) : {};
        return {
          text: link.textContent,
          href: link.href,
          clickListeners: events.click ? events.click.length : 'unknown'
        };
      });
    });
    
    console.log('\n🔍 Event listener analysis:');
    eventListenerCount.forEach(info => {
      console.log(`  ${info.text}: ${info.clickListeners} click listeners`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'navigation_test_FATAL_ERROR.png' });
  } finally {
    console.log('\n🏁 Test completed. Check screenshots for visual evidence.');
    await browser.close();
  }
}

testNavigationFunctionality().catch(console.error);