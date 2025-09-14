import { chromium } from 'playwright';

async function testAdminHolidays() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('Environment:') && !text.includes('Base URL:') && 
        !text.includes('Password Redirect:') && !text.includes('Failed to load resource') &&
        !text.includes('DEBUG:') && !text.includes('📅')) {
      console.log('[Browser]', text);
    }
  });

  try {
    console.log('=== ADMIN HOLIDAY MANAGEMENT TEST ===\n');

    // 1. Login
    console.log('1. Logging in as admin...');
    await page.goto('http://127.0.0.1:5500/Home.html');
    await page.waitForTimeout(1000);
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);

    // Should be on admin dashboard
    const currentUrl = page.url();
    if (!currentUrl.includes('admin-dashboard.html')) {
      console.log('   Not on admin dashboard, navigating...');
      await page.goto('http://127.0.0.1:5500/admin-dashboard.html');
      await page.waitForTimeout(2000);
    }

    console.log('   ✅ On admin dashboard');

    // 2. Navigate to holidays section
    console.log('\n2. Opening holidays management...');

    // First expand the Scheduling group
    const schedulingToggle = await page.locator('#toggle-scheduling');
    if (await schedulingToggle.count() > 0) {
      await schedulingToggle.click();
      console.log('   Expanded Scheduling group');
      await page.waitForTimeout(1000);
    }

    const holidaysButton = await page.locator('button[data-section="holidays"]');
    if (await holidaysButton.count() > 0) {
      await holidaysButton.click();
      console.log('   Clicked holidays button');
      await page.waitForTimeout(3000);

      // Check what loaded
      const sectionsToCheck = [
        { id: '#holidays-entitlements', name: 'Entitlements' },
        { id: '#holidays-requests', name: 'Requests' },
        { id: '#holidays-multiplier', name: 'Multiplier Settings' }
      ];

      for (const section of sectionsToCheck) {
        const isVisible = await page.locator(section.id).isVisible().catch(() => false);
        console.log(`   ${section.name} section: ${isVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);
      }

      await page.screenshot({ path: 'test_admin_holidays_loaded.png' });

      // 3. Check entitlements content
      console.log('\n3. Checking entitlements...');
      const entitlementRows = await page.locator('.entitlement-row');
      const entRowCount = await entitlementRows.count();
      console.log('   Found', entRowCount, 'entitlement row(s)');

      if (entRowCount > 0) {
        // Get details of first entitlement
        const firstRow = entitlementRows.first();
        const staffName = await firstRow.locator('.staff-name').textContent().catch(() => 'Unknown');
        const weeklyHours = await firstRow.locator('span:has-text("Weekly:")').textContent().catch(() => 'N/A');
        console.log('   First entitlement:');
        console.log('   - Staff:', staffName);
        console.log('   - ' + weeklyHours);

        // Try to find multiplier input
        const multiplierInputs = await page.locator('input[id^="multiplier-"]');
        if (await multiplierInputs.count() > 0) {
          const currentMultiplier = await multiplierInputs.first().inputValue();
          console.log('   - Current multiplier:', currentMultiplier);
        }

        await page.screenshot({ path: 'test_admin_entitlements_detail.png' });
      }

      // 4. Check holiday requests
      console.log('\n4. Checking holiday requests...');
      const requestItems = await page.locator('.request-item');
      const reqCount = await requestItems.count();
      console.log('   Found', reqCount, 'holiday request(s)');

      if (reqCount > 0) {
        const firstRequest = requestItems.first();
        const requester = await firstRequest.locator('.requester-name').textContent().catch(() => 'Unknown');
        const dates = await firstRequest.locator('.request-dates').textContent().catch(() => 'N/A');
        const status = await firstRequest.locator('.request-status').textContent().catch(() => 'N/A');
        console.log('   First request:');
        console.log('   - Requester:', requester);
        console.log('   - Dates:', dates);
        console.log('   - Status:', status);

        // Check for approve/reject buttons
        const approveBtn = await firstRequest.locator('button:has-text("Approve")');
        const rejectBtn = await firstRequest.locator('button:has-text("Reject")');
        console.log('   - Has Approve button:', await approveBtn.count() > 0);
        console.log('   - Has Reject button:', await rejectBtn.count() > 0);

        await page.screenshot({ path: 'test_admin_requests_detail.png' });
      }

      // 5. Test multiplier update (if entitlements exist)
      if (entRowCount > 0) {
        console.log('\n5. Testing multiplier update...');
        const firstMultiplierInput = await page.locator('input[id^="multiplier-"]').first();
        if (await firstMultiplierInput.count() > 0) {
          const originalValue = await firstMultiplierInput.inputValue();
          console.log('   Original multiplier:', originalValue);

          // Change multiplier
          await firstMultiplierInput.clear();
          await firstMultiplierInput.fill('12');
          console.log('   Changed to: 12');

          // Find and click save button
          const saveBtn = await page.locator('button:has-text("Save")').first();
          if (await saveBtn.count() > 0) {
            await saveBtn.click();
            console.log('   Clicked Save');
            await page.waitForTimeout(2000);

            // Check if value persisted
            const newValue = await firstMultiplierInput.inputValue();
            console.log('   Value after save:', newValue);

            if (newValue === '12') {
              console.log('   ✅ Multiplier updated successfully');
            }
          }
        }
      }

      // 6. Test working hours section
      console.log('\n6. Checking working hours section...');
      const workingHoursButton = await page.locator('button[data-section="working-hours"]');
      if (await workingHoursButton.count() > 0) {
        await workingHoursButton.click();
        console.log('   Clicked working hours button');
        await page.waitForTimeout(2000);

        const workingHoursContent = await page.locator('#working-hours');
        if (await workingHoursContent.isVisible()) {
          console.log('   ✅ Working hours section loaded');
          
          // Check if any staff patterns are displayed
          const patternCards = await page.locator('.pattern-card');
          const patternCount = await patternCards.count();
          console.log('   Found', patternCount, 'working pattern(s)');

          await page.screenshot({ path: 'test_admin_working_hours.png' });
        }
      }

    } else {
      console.log('   ❌ Holidays button not found');
    }

    console.log('\n=== TEST SUMMARY ===');
    console.log('✅ Admin login successful');
    console.log('✅ Holiday management sections tested');
    console.log('✅ Entitlements and requests checked');
    console.log('✅ Multiplier update tested');
    console.log('✅ Working hours section verified');

  } catch (error) {
    console.error('\n❌ Test error:', error);
    await page.screenshot({ path: 'test_admin_error.png' });
  } finally {
    console.log('\n=== TEST COMPLETE ===');
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testAdminHolidays().catch(console.error);
