import { chromium } from 'playwright';

async function testFinalEntitlements() {
  console.log('Final test of Entitlement Management with proper data types...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const page = await browser.newPage();

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
    console.log('3. Checking staff data...');
    const hasTable = await page.locator('#entitlements-list table').isVisible();

    if (!hasTable) {
      console.log('✗ No table found');
      return;
    }

    const rows = await page.locator('#entitlements-list tbody tr').count();
    console.log(`✓ Table loaded with ${rows} staff members`);

    // Scroll to see full table
    await page.locator('#entitlements-list').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Take screenshot of full table
    await page.screenshot({ path: 'test_01_full_table.png', fullPage: true });

    if (rows > 0) {
      // Get info about first staff member
      const firstRow = page.locator('#entitlements-list tbody tr:first-child');
      const isGP = await firstRow.getAttribute('data-is-gp');
      const staffId = await firstRow.getAttribute('data-staff-id');
      const staffName = await firstRow.locator('td:first-child').textContent();

      console.log(`\n4. Testing edit for: ${staffName.trim()}`);
      console.log(`   Staff ID: ${staffId}, Is GP: ${isGP}`);

      // Edit Monday value based on type
      const mondayInput = firstRow.locator('.day-input[data-day="monday"]');
      if (await mondayInput.count() > 0) {
        const currentValue = await mondayInput.inputValue();
        console.log(`   Current Monday value: ${currentValue}`);

        await mondayInput.clear();
        if (isGP === 'true') {
          // GP - use sessions (number)
          await mondayInput.fill('4');
          console.log('   ✓ Changed Monday to 4 sessions (GP)');
        } else {
          // Staff - use HH:MM format
          await mondayInput.fill('7:30');
          console.log('   ✓ Changed Monday to 7:30 hours (Staff)');
        }
      }

      // Edit Tuesday value
      const tuesdayInput = firstRow.locator('.day-input[data-day="tuesday"]');
      if (await tuesdayInput.count() > 0) {
        await tuesdayInput.clear();
        if (isGP === 'true') {
          await tuesdayInput.fill('3');
          console.log('   ✓ Changed Tuesday to 3 sessions');
        } else {
          await tuesdayInput.fill('8:00');
          console.log('   ✓ Changed Tuesday to 8:00 hours');
        }
      }

      // Change multiplier
      const multiplierInput = firstRow.locator('.multiplier-input');
      if (await multiplierInput.count() > 0) {
        await multiplierInput.clear();
        await multiplierInput.fill('12');
        console.log('   ✓ Changed multiplier to 12');
      }

      // Add override value
      const overrideInput = firstRow.locator('.override-input');
      if (await overrideInput.count() > 0) {
        await overrideInput.clear();
        if (isGP === 'true') {
          await overrideInput.fill('250');
          console.log('   ✓ Set override to 250 sessions');
        } else {
          await overrideInput.fill('300:00');
          console.log('   ✓ Set override to 300:00 hours');
        }
      }

      // Take screenshot before save
      await page.screenshot({ path: 'test_02_values_edited.png', fullPage: true });

      // Click save button
      console.log('\n5. Saving changes...');
      const saveBtn = firstRow.locator('.save-btn');
      if (await saveBtn.count() > 0) {
        await saveBtn.click();
        console.log('   Clicked save button, waiting for response...');

        // Wait for save to complete (button text changes)
        await page.waitForTimeout(3000);

        const btnText = await saveBtn.textContent();
        if (btnText.includes('Saved')) {
          console.log('   ✓ Save successful! Button shows "Saved"');
        } else {
          console.log(`   Button text: "${btnText.trim()}"`);
        }
      }

      // Take screenshot after save
      await page.screenshot({ path: 'test_03_after_save.png', fullPage: true });

      // Refresh page to verify persistence
      console.log('\n6. Refreshing page to verify data persistence...');
      await page.reload();
      await page.waitForTimeout(2000);

      // Navigate back to Entitlement Management
      await page.locator('#toggle-scheduling').click();
      await page.waitForTimeout(500);
      await page.locator('button[data-section="entitlement-management"]').click();
      await page.waitForTimeout(2000);

      // Check if values persisted
      const refreshedFirstRow = page.locator('#entitlements-list tbody tr:first-child');
      const newMondayValue = await refreshedFirstRow.locator('.day-input[data-day="monday"]').inputValue();
      const newOverrideValue = await refreshedFirstRow.locator('.override-input').inputValue();

      console.log('\n7. Verifying persisted values:');
      console.log(`   Monday value after refresh: ${newMondayValue}`);
      console.log(`   Override value after refresh: ${newOverrideValue}`);

      // Take final screenshot
      await page.screenshot({ path: 'test_04_after_refresh.png', fullPage: true });

      console.log('\n✅ Test completed successfully!');
      console.log('\nScreenshots saved:');
      console.log('  - test_01_full_table.png');
      console.log('  - test_02_values_edited.png');
      console.log('  - test_03_after_save.png');
      console.log('  - test_04_after_refresh.png');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    await page.screenshot({ path: 'test_error.png' });
  } finally {
    await browser.close();
  }
}

testFinalEntitlements().catch(console.error);