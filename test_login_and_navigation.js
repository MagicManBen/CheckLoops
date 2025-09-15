import { chromium } from 'playwright';

async function testLoginAndNavigation() {
  console.log('Starting comprehensive login and navigation test...');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000 // Slow down to observe the behavior
  });

  try {
    const page = await browser.newPage();

    // Enable console logging to see what's happening
    page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
    page.on('pageerror', error => console.error(`PAGE ERROR: ${error.message}`));

    // Set up navigation monitoring
    let navigationCount = 0;
    const navigationLog = [];

    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        navigationCount++;
        const url = frame.url();
        navigationLog.push({ count: navigationCount, url, time: Date.now() });
        console.log(`🔄 Navigation ${navigationCount}: ${url}`);
      }
    });

    console.log('\n=== TEST 1: Navigation from Index ===');

    // 1. Test navigation from index.html
    await page.goto('http://127.0.0.1:58156/index.html');
    await page.waitForLoadState('networkidle');
    console.log('✅ Index page loaded');

    // Reset navigation counter
    navigationCount = 0;
    navigationLog.length = 0;

    // Click Staff Login and monitor for bouncing
    console.log('🔄 Clicking Staff Login button...');
    await page.click('.auth-buttons button:has-text("Staff Login")');

    // Wait 5 seconds to see if there's bouncing
    console.log('⏳ Monitoring for redirect loops (5 seconds)...');
    await page.waitForTimeout(5000);

    console.log('\n=== Navigation Analysis ===');
    console.log(`Total navigations: ${navigationCount}`);
    console.log('Navigation history:', navigationLog);

    if (navigationCount > 2) {
      console.error('❌ REDIRECT LOOP DETECTED!');
      return false;
    } else if (page.url().includes('home.html')) {
      console.log('✅ Successfully navigated to home.html without loops');
    }

    await page.screenshot({ path: 'navigation_test_result.png' });

    console.log('\n=== TEST 2: Login Credentials ===');

    // Test credentials from CLAUDE.md
    const credentials = [
      { email: 'ben.howard@stoke.nhs.uk', password: 'Hello1!', name: 'CLAUDE.md credentials' },
      { email: 'benhowardmagic@hotmail.com', password: 'Hello1!', name: 'Magic account with Hello1!' },
      { email: 'benhowardmagic@hotmail.com', password: 'password', name: 'Magic account with password' },
      { email: 'benhowardmagic@hotmail.com', password: 'admin', name: 'Magic account with admin' }
    ];

    for (const cred of credentials) {
      console.log(`\n🔑 Testing ${cred.name}...`);

      // Clear any existing session
      await page.goto('http://127.0.0.1:58156/home.html?force=login');
      await page.waitForLoadState('networkidle');

      // Fill in credentials
      await page.locator('#email').fill(cred.email);
      await page.locator('#password').fill(cred.password);

      // Reset navigation tracking
      navigationCount = 0;
      navigationLog.length = 0;

      // Submit form
      await page.click('button[type="submit"]:has-text("Sign In")');
      await page.waitForTimeout(3000);

      // Check for error messages
      const errorElement = await page.locator('#auth-error').textContent();
      const currentUrl = page.url();

      console.log(`   Current URL: ${currentUrl}`);
      console.log(`   Error message: ${errorElement || 'None'}`);
      console.log(`   Navigations after login: ${navigationCount}`);

      if (errorElement && errorElement.trim()) {
        console.log(`   ❌ Login failed: ${errorElement}`);
      } else if (currentUrl.includes('staff.html') || currentUrl.includes('staff-welcome.html')) {
        console.log(`   ✅ Login successful! Redirected to: ${currentUrl}`);
        await page.screenshot({ path: `login_success_${cred.email.replace(/[@.]/g, '_')}.png` });
        break; // Stop testing once we find working credentials
      } else {
        console.log(`   ⚠️ Unexpected state: ${currentUrl}`);
      }

      await page.screenshot({ path: `login_attempt_${cred.email.replace(/[@.]/g, '_')}.png` });
    }

    console.log('\n=== TEST 3: Manual Debugging ===');
    console.log('🔍 Checking auth state on home.html...');

    await page.goto('http://127.0.0.1:58156/home.html?force=login');
    await page.waitForLoadState('networkidle');

    // Check if Supabase client is available
    const supabaseCheck = await page.evaluate(() => {
      return {
        hasSupabase: typeof window.supabase !== 'undefined',
        hasCreateClient: typeof createClient !== 'undefined',
        hasConfig: typeof window.CONFIG !== 'undefined',
        authUrl: window.CONFIG?.SUPABASE_URL || 'Not found'
      };
    });

    console.log('Supabase client check:', supabaseCheck);

    await page.screenshot({ path: 'debug_home_page.png' });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
    console.log('\n✅ Test completed. Check screenshots for visual confirmation.');
  }
}

testLoginAndNavigation().catch(console.error);