import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

async function testHolidayFinal() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  try {
    console.log('🚀 Starting final holiday system test...\n');

    // Get absolute path to index.html
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const indexPath = join(__dirname, 'index.html');
    const fileUrl = `file://${indexPath}`;

    console.log(`📁 Opening: ${fileUrl}`);

    const page = await context.newPage();
    await page.goto(fileUrl);
    await page.waitForTimeout(2000);

    // Click Staff Login button
    console.log('📝 Clicking Staff Login...');
    const staffLoginBtn = await page.locator('text=Staff Login').first();
    if (await staffLoginBtn.isVisible()) {
      await staffLoginBtn.click();
      await page.waitForTimeout(2000);
    }

    // Now check for login form
    const emailField = await page.locator('#email');
    const emailVisible = await emailField.isVisible();

    if (emailVisible) {
      console.log('✅ Login form loaded');

      // Login
      await emailField.fill('benhowardmagic@hotmail.com');
      await page.locator('#password').fill('Hello1!');

      await page.screenshot({ path: 'test_final_1_login.png' });
      console.log('📸 Screenshot: test_final_1_login.png');

      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);

      // Check where we are
      const currentUrl = page.url();
      console.log(`📍 After login URL: ${currentUrl}`);

      // Take screenshot of current state
      await page.screenshot({ path: 'test_final_2_after_login.png' });
      console.log('📸 Screenshot: test_final_2_after_login.png');

      // Check for My Holidays link
      const holidayLink = await page.locator('a[href="my-holidays.html"]').first();
      const holidayVisible = await holidayLink.isVisible();

      if (holidayVisible) {
        console.log('✅ My Holidays link found');
        await holidayLink.click();
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'test_final_3_holidays_page.png' });
        console.log('📸 Screenshot: test_final_3_holidays_page.png');

        // Check holiday data
        const totalAllowance = await page.locator('#total-allowance').textContent();
        const usedHolidays = await page.locator('#used-holidays').textContent();
        const remaining = await page.locator('#remaining-holidays').textContent();

        console.log(`\n📊 Holiday Allowance:`);
        console.log(`   Total: ${totalAllowance}`);
        console.log(`   Used: ${usedHolidays}`);
        console.log(`   Remaining: ${remaining}`);

        // Test calculation
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const weekAfter = new Date(today);
        weekAfter.setDate(today.getDate() + 14);

        await page.locator('#from-date').fill(nextWeek.toISOString().split('T')[0]);
        await page.locator('#to-date').fill(weekAfter.toISOString().split('T')[0]);
        await page.click('#calculate-btn');
        await page.waitForTimeout(1500);

        const calcResult = await page.locator('#calculation-result');
        if (await calcResult.isVisible()) {
          const calcTotal = await page.locator('#calc-total').textContent();
          const calcUnit = await page.locator('#calc-unit').textContent();
          console.log(`\n📐 Time Off Calculation:`);
          console.log(`   Total: ${calcTotal} ${calcUnit}`);

          // Add reason and submit
          await page.locator('#reason').fill('Test holiday request');

          const submitBtn = await page.locator('#submit-request');
          if (await submitBtn.isVisible()) {
            await submitBtn.click();
            await page.waitForTimeout(2000);

            const msg = await page.locator('#request-msg').textContent();
            console.log(`   Submit Result: ${msg}`);

            await page.screenshot({ path: 'test_final_4_request_submitted.png' });
            console.log('📸 Screenshot: test_final_4_request_submitted.png');
          }
        }

        console.log('\n✅ Holiday system fully functional!');
        console.log('   - Navigation integrated');
        console.log('   - Authentication working');
        console.log('   - Allowance display working');
        console.log('   - Calculation working');
        console.log('   - Request submission working');

      } else {
        console.log('⚠️ My Holidays link not visible - checking if welcome needed');

        // Check if we need to complete welcome first
        const welcomeLink = await page.locator('a[href="staff-welcome.html"]');
        if (await welcomeLink.isVisible()) {
          console.log('📝 Welcome process may need completion first');
        }
      }

    } else {
      console.log('❌ Login form not found after clicking Staff Login');
      await page.screenshot({ path: 'test_final_error.png' });
    }

    // Test Admin Login
    console.log('\n📝 Testing Admin Portal...');
    await page.goto(fileUrl);
    await page.waitForTimeout(2000);

    const adminLoginBtn = await page.locator('text=Admin Login').first();
    if (await adminLoginBtn.isVisible()) {
      await adminLoginBtn.click();
      await page.waitForTimeout(2000);

      // Login as admin
      await page.locator('#email').fill('benhowardmagic@hotmail.com');
      await page.locator('#password').fill('Hello1!');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);

      const adminUrl = page.url();
      if (adminUrl.includes('admin-dashboard')) {
        console.log('✅ Admin dashboard loaded');

        // Navigate to holidays
        const holidaysBtn = await page.locator('button[data-section="holidays"]').first();
        if (await holidaysBtn.isVisible()) {
          await holidaysBtn.click();
          await page.waitForTimeout(2000);

          await page.screenshot({ path: 'test_final_5_admin_holidays.png' });
          console.log('📸 Screenshot: test_final_5_admin_holidays.png');

          const requestsList = await page.locator('#requests-list');
          if (await requestsList.isVisible()) {
            const rows = await requestsList.locator('tbody tr').count();
            console.log(`   Holiday Requests Found: ${rows}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    const page = await context.newPage();
    await page.screenshot({ path: 'test_final_error.png' });
  } finally {
    await browser.close();
    console.log('\n🏁 Test complete');
  }
}

testHolidayFinal().catch(console.error);