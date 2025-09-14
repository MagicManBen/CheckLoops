import { chromium } from 'playwright';

async function testHolidayNavigation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Testing Holiday System Navigation...\n');
    console.log('📍 URL: http://127.0.0.1:5500\n');

    // Navigate to homepage
    console.log('Step 1: Opening homepage...');
    await page.goto('http://127.0.0.1:5500/index.html');
    await page.waitForTimeout(2000);

    // Click Staff Login
    console.log('Step 2: Clicking Staff Login...');
    await page.click('text=Staff Login');
    await page.waitForTimeout(2000);

    // Login
    console.log('Step 3: Logging in...');
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    console.log('   Current URL after login:', page.url());
    await page.screenshot({ path: 'nav_1_after_login.png' });

    // Try direct navigation to My Holidays
    console.log('\nStep 4: Direct navigation to My Holidays...');
    await page.goto('http://127.0.0.1:5500/my-holidays.html');
    await page.waitForTimeout(3000);

    console.log('   Current URL after navigation:', page.url());
    await page.screenshot({ path: 'nav_2_my_holidays.png' });

    // Check what's on the page
    const pageTitle = await page.title();
    console.log('   Page title:', pageTitle);

    // Check if we're still logged in
    const emailPill = await page.locator('#email-pill');
    if (await emailPill.isVisible()) {
      const emailText = await emailPill.textContent();
      console.log('   Logged in as:', emailText);
    } else {
      console.log('   ⚠️ Email pill not visible - may not be logged in');
    }

    // Check if holiday content is visible
    const holidayTitle = await page.locator('text=My Holiday Allowance');
    if (await holidayTitle.isVisible()) {
      console.log('   ✅ Holiday page content is visible');

      // Try to get allowance data
      const totalAllowance = await page.locator('#total-allowance');
      if (await totalAllowance.isVisible()) {
        const value = await totalAllowance.textContent();
        console.log('   Total allowance:', value);
      } else {
        console.log('   ⚠️ Total allowance not visible');
      }
    } else {
      console.log('   ⚠️ Holiday page content not visible');

      // Check for setup required message
      const setupMsg = await page.locator('text=Holiday Setup Required');
      if (await setupMsg.isVisible()) {
        console.log('   📝 Holiday setup required - user needs to complete welcome process');
        await page.screenshot({ path: 'nav_setup_required.png' });
      }
    }

    console.log('\n✅ Navigation test complete!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'nav_error.png' });
  } finally {
    await browser.close();
    console.log('\n🏁 Browser closed');
  }
}

testHolidayNavigation().catch(console.error);