import { chromium } from 'playwright';

async function quickTestEntitlements() {
  console.log('Quick test of Entitlement Management data loading...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200
  });

  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Loading holiday entitlements') ||
        text.includes('Loaded profiles') ||
        text.includes('Error')) {
      console.log('Console:', text);
    }
  });

  try {
    // Navigate and login
    console.log('1. Logging in...');
    await page.goto('http://127.0.0.1:58156/admin-login.html');
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('input[type="password"]').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);

    // Navigate to Entitlement Management
    console.log('2. Opening Entitlement Management...');
    await page.locator('#toggle-scheduling').click();
    await page.waitForTimeout(500);
    await page.locator('button[data-section="entitlement-management"]').click();
    await page.waitForTimeout(3000);

    // Check if data loaded
    console.log('3. Checking if staff data loaded...');
    const hasTable = await page.locator('#entitlements-list table').isVisible().catch(() => false);

    if (hasTable) {
      const rows = await page.locator('#entitlements-list tbody tr').count();
      console.log(`✓ Table loaded with ${rows} staff members`);

      // Take screenshot
      await page.screenshot({ path: 'test_entitlements_loaded.png', fullPage: true });

      // Try editing first row if exists
      if (rows > 0) {
        console.log('4. Testing edit functionality...');

        // Change Monday value for first staff
        const firstMondayInput = page.locator('#entitlements-list tbody tr:first-child .day-input[data-day="monday"]');
        if (await firstMondayInput.count() > 0) {
          await firstMondayInput.clear();
          await firstMondayInput.fill('8:00');
          console.log('✓ Changed Monday hours');

          // Click save
          const saveBtn = page.locator('#entitlements-list tbody tr:first-child .save-btn');
          if (await saveBtn.count() > 0) {
            await saveBtn.click();
            console.log('✓ Clicked save button');
            await page.waitForTimeout(2000);

            // Check if saved
            const btnText = await saveBtn.textContent();
            if (btnText.includes('Saved')) {
              console.log('✓ Save successful!');
            }
          }
        }
      }
    } else {
      console.log('✗ No table found');
      const content = await page.locator('#entitlements-list').textContent();
      console.log('Content:', content);
    }

    console.log('\n✅ Test completed!');

  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

quickTestEntitlements().catch(console.error);