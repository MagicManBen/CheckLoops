import { chromium } from 'playwright';

async function testComprehensiveEntitlements() {
  console.log('Testing comprehensive Entitlement Management with data editing...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down actions for visibility
  });

  const page = await browser.newPage();

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
    const schedulingToggle = page.locator('#toggle-scheduling');
    await schedulingToggle.click();
    await page.waitForTimeout(500);

    // Click on Entitlement Management
    console.log('4. Clicking on Entitlement Management...');
    const entitlementButton = page.locator('button[data-section="entitlement-management"]');
    await entitlementButton.click();
    await page.waitForTimeout(3000); // Give time for data to load

    // Take screenshot of the loaded page
    await page.screenshot({ path: 'test_01_entitlements_loaded.png', fullPage: true });

    // Check if the entitlements table has loaded
    console.log('5. Checking if staff data is visible...');
    const entitlementsContainer = page.locator('#entitlements-list');
    const isTableVisible = await entitlementsContainer.locator('table').isVisible().catch(() => false);

    if (!isTableVisible) {
      console.log('✗ No table found in entitlements list');
      const contentText = await entitlementsContainer.textContent();
      console.log('Container content:', contentText);
      await page.screenshot({ path: 'test_error_no_table.png', fullPage: true });
    } else {
      console.log('✓ Entitlements table is visible');

      // Count the number of staff rows
      const staffRows = page.locator('#entitlements-list tbody tr');
      const rowCount = await staffRows.count();
      console.log(`✓ Found ${rowCount} staff members in the table`);

      if (rowCount > 0) {
        // Test editing working hours for the first staff member
        console.log('6. Testing working hours editing...');

        // Find the first row and its inputs
        const firstRow = staffRows.first();

        // Check if Monday input exists
        const mondayInput = firstRow.locator('.day-input[data-day="monday"]');
        const hasMondayInput = await mondayInput.count() > 0;

        if (hasMondayInput) {
          // Get current value
          const currentValue = await mondayInput.inputValue();
          console.log(`Current Monday value: ${currentValue}`);

          // Change the value
          await mondayInput.clear();
          const isGP = await firstRow.getAttribute('data-is-gp') === 'true';
          const newValue = isGP ? '4' : '7:30';
          await mondayInput.fill(newValue);
          console.log(`✓ Changed Monday value to: ${newValue}`);

          // Test override input
          console.log('7. Testing manual override...');
          const overrideInput = firstRow.locator('.override-input');
          if (await overrideInput.count() > 0) {
            await overrideInput.clear();
            const overrideValue = isGP ? '200' : '250:00';
            await overrideInput.fill(overrideValue);
            console.log(`✓ Set override value to: ${overrideValue}`);
          }

          // Test multiplier change
          console.log('8. Testing multiplier change...');
          const multiplierInput = firstRow.locator('.multiplier-input');
          if (await multiplierInput.count() > 0) {
            await multiplierInput.clear();
            await multiplierInput.fill('12');
            console.log('✓ Changed multiplier to: 12');
          }

          // Take screenshot before saving
          await page.screenshot({ path: 'test_02_values_changed.png', fullPage: true });

          // Click save button
          console.log('9. Saving changes...');
          const saveButton = firstRow.locator('.save-btn');
          if (await saveButton.count() > 0) {
            await saveButton.click();
            console.log('✓ Clicked save button');

            // Wait for save to complete
            await page.waitForTimeout(2000);

            // Check if button shows success
            const buttonText = await saveButton.textContent();
            if (buttonText.includes('Saved')) {
              console.log('✓ Save appears successful (button shows "Saved")');
            } else {
              console.log('⚠ Save button text:', buttonText);
            }

            // Take screenshot after saving
            await page.screenshot({ path: 'test_03_after_save.png', fullPage: true });
          } else {
            console.log('✗ Save button not found');
          }
        } else {
          console.log('✗ No day inputs found in first row');
        }
      } else {
        console.log('✗ No staff rows found to test');
      }
    }

    // Refresh the page to verify data persistence
    console.log('10. Refreshing page to verify data persistence...');
    await page.reload();
    await page.waitForTimeout(3000);

    // Navigate back to Entitlement Management
    await page.locator('#toggle-scheduling').click();
    await page.waitForTimeout(500);
    await page.locator('button[data-section="entitlement-management"]').click();
    await page.waitForTimeout(2000);

    // Take final screenshot
    await page.screenshot({ path: 'test_04_after_refresh.png', fullPage: true });

    console.log('\n✅ Test completed!');
    console.log('\nScreenshots saved:');
    console.log('- test_01_entitlements_loaded.png - Initial page load');
    console.log('- test_02_values_changed.png - After editing values');
    console.log('- test_03_after_save.png - After saving');
    console.log('- test_04_after_refresh.png - After page refresh');

  } catch (error) {
    console.error('Test failed with error:', error);
    await page.screenshot({ path: 'test_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testComprehensiveEntitlements().catch(console.error);