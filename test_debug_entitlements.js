import { chromium } from 'playwright';

async function testDebugEntitlements() {
  console.log('Debugging Entitlement Management page...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500,
    devtools: true // Open developer tools
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    } else if (msg.type() === 'log') {
      console.log('📝 Console Log:', msg.text());
    }
  });

  // Listen for page errors
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });

  try {
    // Navigate to admin login
    console.log('1. Navigating to admin login...');
    await page.goto('http://127.0.0.1:58156/admin-login.html');
    await page.waitForTimeout(1000);

    // Login with provided credentials
    console.log('2. Logging in as admin...');
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('input[type="password"]').fill('Hello1!');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard to load
    await page.waitForTimeout(3000);

    // Click on Scheduling dropdown to expand it
    console.log('3. Expanding Scheduling menu...');
    await page.locator('#toggle-scheduling').click();
    await page.waitForTimeout(500);

    // Click on Entitlement Management
    console.log('4. Clicking on Entitlement Management...');
    await page.locator('button[data-section="entitlement-management"]').click();

    // Wait for data to load
    console.log('5. Waiting for data to load...');
    await page.waitForTimeout(5000);

    // Check if loadHolidayEntitlements function exists
    const functionExists = await page.evaluate(() => {
      return typeof window.loadHolidayEntitlements === 'function';
    });
    console.log('loadHolidayEntitlements function exists:', functionExists);

    // Try to manually call the function
    if (functionExists) {
      console.log('6. Manually calling loadHolidayEntitlements...');
      await page.evaluate(() => {
        if (window.loadHolidayEntitlements) {
          window.loadHolidayEntitlements();
        }
      });
      await page.waitForTimeout(3000);
    }

    // Check the entitlements-list content
    const entitlementsContent = await page.locator('#entitlements-list').innerHTML();
    console.log('\nEntitlements list content:');
    console.log(entitlementsContent.substring(0, 500));

    // Check if Supabase is available
    const supabaseAvailable = await page.evaluate(() => {
      return typeof window.supabase !== 'undefined';
    });
    console.log('\nSupabase available:', supabaseAvailable);

    // Try to fetch data directly
    if (supabaseAvailable) {
      console.log('\n7. Testing direct Supabase query...');
      const profiles = await page.evaluate(async () => {
        try {
          const { data, error } = await window.supabase
            .from('1_staff_holiday_profiles')
            .select('*')
            .limit(5);

          if (error) {
            return { error: error.message };
          }
          return { count: data?.length || 0, sample: data?.[0] };
        } catch (e) {
          return { error: e.message };
        }
      });
      console.log('Direct query result:', profiles);
    }

    // Take screenshot
    await page.screenshot({ path: 'test_debug_entitlements.png', fullPage: true });

    console.log('\n✅ Debug completed!');
    console.log('Check test_debug_entitlements.png for visual state');
    console.log('Press Ctrl+C to close the browser when done inspecting');

    // Keep browser open for manual inspection
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('Debug failed with error:', error);
    await page.screenshot({ path: 'test_debug_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testDebugEntitlements().catch(console.error);