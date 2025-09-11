import { chromium } from 'playwright';

async function testSessionTiming() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[Browser ${msg.type()}]:`, msg.text());
    }
  });
  
  console.log('Testing session timing issue...\n');
  
  try {
    // Navigate to Home.html
    console.log('1. Navigating to Home.html...');
    await page.goto('http://127.0.0.1:5500/Home.html', { waitUntil: 'networkidle' });
    
    // Fill in credentials
    console.log('2. Filling in credentials...');
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    
    // Listen for navigation events
    let navigationCount = 0;
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        navigationCount++;
        console.log(`   Navigation #${navigationCount} to: ${frame.url()}`);
      }
    });
    
    // Submit the form
    console.log('3. Submitting login form...');
    await page.click('button:has-text("Sign In")');
    
    // Wait longer to see all redirects
    console.log('4. Waiting to observe redirect behavior...');
    await page.waitForTimeout(10000);
    
    // Check final URL
    const finalUrl = page.url();
    console.log(`\n5. Final URL after 10 seconds: ${finalUrl}`);
    
    // Check localStorage for session data
    const localStorageData = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const sessionKeys = keys.filter(k => k.startsWith('sb-') || k.includes('supabase'));
      const data = {};
      sessionKeys.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          data[key] = value ? (value.length > 100 ? value.substring(0, 100) + '...' : value) : null;
        } catch (e) {
          data[key] = 'ERROR: ' + e.message;
        }
      });
      return data;
    });
    
    console.log('\n6. Session data in localStorage:');
    console.log(JSON.stringify(localStorageData, null, 2));
    
    // Check if we ended up on the right page
    if (finalUrl.includes('staff.html')) {
      console.log('\n✅ SUCCESS: Stayed on staff.html');
    } else if (finalUrl.includes('Home.html')) {
      console.log('\n❌ ISSUE: Redirected back to Home.html');
      
      // Check for error messages
      const errorVisible = await page.locator('#auth-error').isVisible();
      if (errorVisible) {
        const errorText = await page.locator('#auth-error').textContent();
        console.log('   Error message:', errorText);
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'session_timing_test.png' });
    console.log('\nScreenshot saved as session_timing_test.png');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testSessionTiming();