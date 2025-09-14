import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

async function testHolidayDirect() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  try {
    console.log('🚀 Starting direct file holiday test...\n');

    // Get absolute path to index.html
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const indexPath = join(__dirname, 'index.html');
    const fileUrl = `file://${indexPath}`;

    console.log(`📁 Opening: ${fileUrl}`);

    const page = await context.newPage();
    await page.goto(fileUrl);
    await page.waitForTimeout(2000);

    // Check if login form exists
    const emailField = await page.locator('#email');
    const emailVisible = await emailField.isVisible();

    if (emailVisible) {
      console.log('✅ Login page loaded successfully');

      // Try to login
      await emailField.fill('benhowardmagic@hotmail.com');
      await page.locator('input[type="password"]').fill('Hello1!');

      await page.screenshot({ path: 'test_direct_login.png' });
      console.log('📸 Screenshot saved: test_direct_login.png');

      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);

      // Check where we are now
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}`);

      // Check if we're on staff page
      if (currentUrl.includes('staff.html')) {
        console.log('✅ Successfully logged in to staff page');

        // Check for My Holidays link
        const holidayLink = await page.locator('a[href="my-holidays.html"]');
        const holidayLinkVisible = await holidayLink.isVisible();

        if (holidayLinkVisible) {
          console.log('✅ My Holidays link found');
          await holidayLink.click();
          await page.waitForTimeout(3000);

          // Check My Holidays page
          const holidaysTitle = await page.locator('text=My Holiday Allowance');
          if (await holidaysTitle.isVisible()) {
            console.log('✅ My Holidays page loaded successfully');

            // Check authentication state
            const emailPill = await page.locator('#email-pill').textContent();
            console.log(`👤 Logged in as: ${emailPill}`);

            // Check holiday data
            const totalAllowance = await page.locator('#total-allowance').textContent();
            const usedHolidays = await page.locator('#used-holidays').textContent();
            const remaining = await page.locator('#remaining-holidays').textContent();

            console.log(`📊 Holiday Data:`);
            console.log(`   - Total Allowance: ${totalAllowance}`);
            console.log(`   - Used: ${usedHolidays}`);
            console.log(`   - Remaining: ${remaining}`);

            await page.screenshot({ path: 'test_holidays_loaded.png' });
            console.log('📸 Screenshot saved: test_holidays_loaded.png');

            // Test booking calculation
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const dayAfter = new Date(today);
            dayAfter.setDate(today.getDate() + 2);

            await page.locator('#from-date').fill(tomorrow.toISOString().split('T')[0]);
            await page.locator('#to-date').fill(dayAfter.toISOString().split('T')[0]);
            await page.click('#calculate-btn');
            await page.waitForTimeout(1000);

            const calcResult = await page.locator('#calculation-result');
            if (await calcResult.isVisible()) {
              const calcTotal = await page.locator('#calc-total').textContent();
              const calcUnit = await page.locator('#calc-unit').textContent();
              console.log(`📐 Calculated: ${calcTotal} ${calcUnit}`);

              await page.screenshot({ path: 'test_calculation_done.png' });
              console.log('📸 Screenshot saved: test_calculation_done.png');
            }

            console.log('\n✅ All holiday features working!');
          } else {
            console.log('⚠️ My Holidays page not loading correctly');
            await page.screenshot({ path: 'test_holidays_error.png' });
          }
        } else {
          console.log('⚠️ My Holidays link not found');
          await page.screenshot({ path: 'test_no_holidays_link.png' });
        }
      } else {
        console.log('⚠️ Not redirected to staff page after login');
        await page.screenshot({ path: 'test_login_redirect_issue.png' });
      }
    } else {
      console.log('❌ Login form not found');
      await page.screenshot({ path: 'test_no_login_form.png' });
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);

    const page = await context.newPage();
    await page.screenshot({ path: 'test_error.png' });
  } finally {
    await browser.close();
    console.log('\n🏁 Browser closed');
  }
}

testHolidayDirect().catch(console.error);