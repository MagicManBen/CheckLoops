import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

async function testHolidayHoursFormat() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  try {
    console.log('🚀 Testing holiday hours format (HH:MM)...\n');

    // Get absolute path to index.html
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const indexPath = join(__dirname, 'index.html');
    const fileUrl = `file://${indexPath}`;

    const page = await context.newPage();
    await page.goto(fileUrl);
    await page.waitForTimeout(2000);

    // Click Staff Login
    console.log('📝 Logging in as staff...');
    await page.click('text=Staff Login');
    await page.waitForTimeout(2000);

    // Login
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // Navigate to My Holidays
    console.log('📅 Navigating to My Holidays...');
    const holidayLink = await page.locator('a[href="my-holidays.html"]').first();
    if (await holidayLink.isVisible()) {
      await holidayLink.click();
      await page.waitForTimeout(3000);

      // Take screenshot of initial state
      await page.screenshot({ path: 'test_holidays_initial.png' });
      console.log('📸 Screenshot: test_holidays_initial.png');

      // Check if setup required
      const setupRequired = await page.locator('text=Holiday Setup Required').isVisible();
      if (setupRequired) {
        console.log('⚠️ Holiday setup required - complete welcome process first');
        return;
      }

      // Check displayed format
      const totalAllowance = await page.locator('#total-allowance').textContent();
      const totalUnit = await page.locator('#allowance-unit').textContent();
      console.log(`\n📊 Total Allowance: ${totalAllowance} ${totalUnit}`);

      const usedHolidays = await page.locator('#used-holidays').textContent();
      const usedUnit = await page.locator('#used-unit').textContent();
      console.log(`   Used: ${usedHolidays} ${usedUnit}`);

      const remaining = await page.locator('#remaining-holidays').textContent();
      const remainingUnit = await page.locator('#remaining-unit').textContent();
      console.log(`   Remaining: ${remaining} ${remainingUnit}`);

      // Test calculation
      console.log('\n📐 Testing holiday calculation...');
      const today = new Date();
      const nextMonday = new Date(today);
      const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7;
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      const nextFriday = new Date(nextMonday);
      nextFriday.setDate(nextMonday.getDate() + 4);

      await page.locator('#from-date').fill(nextMonday.toISOString().split('T')[0]);
      await page.locator('#to-date').fill(nextFriday.toISOString().split('T')[0]);
      await page.click('#calculate-btn');
      await page.waitForTimeout(2000);

      // Check calculation result
      const calcResult = await page.locator('#calculation-result').isVisible();
      if (calcResult) {
        const calcTotal = await page.locator('#calc-total').textContent();
        const calcUnit = await page.locator('#calc-unit').textContent();
        console.log(`   Calculated: ${calcTotal} ${calcUnit}`);

        // Take screenshot of calculation
        await page.screenshot({ path: 'test_holidays_calculated.png' });
        console.log('📸 Screenshot: test_holidays_calculated.png');

        // Check format
        if (totalUnit === '' || totalUnit === 'sessions') {
          if (totalUnit === 'sessions') {
            console.log('✅ GP format: Using sessions');
          } else if (totalAllowance.includes(':')) {
            console.log('✅ Staff format: Using HH:MM format');
          } else {
            console.log('⚠️ Format issue: Expected HH:MM but got', totalAllowance);
          }
        }

        // Check calculation format
        if (calcUnit === '' && calcTotal.includes(':')) {
          console.log('✅ Calculation format: HH:MM for staff');
        } else if (calcUnit === 'sessions' || calcUnit === 'session') {
          console.log('✅ Calculation format: Sessions for GP');
        } else {
          console.log('⚠️ Unexpected calculation format');
        }
      }

      console.log('\n✅ Holiday hours format test complete!');
    } else {
      console.log('⚠️ My Holidays link not found');
      await page.screenshot({ path: 'test_no_holidays_link.png' });
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    const page = await context.newPage();
    await page.screenshot({ path: 'test_error.png' });
  } finally {
    await browser.close();
    console.log('\n🏁 Test complete');
  }
}

testHolidayHoursFormat().catch(console.error);