import { chromium } from 'playwright';

async function testHolidayRedesign() {
  console.log('🧪 Testing redesigned my-holidays.html...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Login flow
    console.log('1. Navigating to login page...');
    await page.goto('http://127.0.0.1:58156/index.html');
    await page.waitForTimeout(2000);

    console.log('2. Logging in...');
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('input[type="password"]').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // Navigate to holidays
    console.log('3. Navigating to my-holidays.html...');
    await page.goto('http://127.0.0.1:58156/my-holidays.html');
    await page.waitForTimeout(3000);

    // Take screenshot of the new design
    console.log('4. Taking screenshot of new design...');
    await page.screenshot({ path: 'holiday_redesign_result.png' });

    // Check key elements exist
    console.log('5. Checking design elements...');

    // Check for staff.css background elements
    const hasWaveBackground = await page.locator('.wave').count() > 0;
    console.log(`   ✓ Wave background present: ${hasWaveBackground}`);

    const hasMeshElements = await page.locator('.mesh .m1').count() > 0;
    console.log(`   ✓ Mesh background elements present: ${hasMeshElements}`);

    // Check for proper topbar
    const hasTopbar = await page.locator('.topbar .nav').count() > 0;
    console.log(`   ✓ Staff-style topbar present: ${hasTopbar}`);

    // Check for stat cards with staff design
    const hasStatCards = await page.locator('.stat-card .icon-wrap').count() > 0;
    console.log(`   ✓ Staff-style stat cards present: ${hasStatCards}`);

    // Check for panel headers with icons
    const hasPanelHeaders = await page.locator('.panel-header .illus-circle').count() > 0;
    console.log(`   ✓ Panel headers with icons present: ${hasPanelHeaders}`);

    // Check for light panel (booking form)
    const hasLightPanel = await page.locator('.panel.light-panel').count() > 0;
    console.log(`   ✓ Light panel for booking form present: ${hasLightPanel}`);

    // Test holiday data loading
    console.log('6. Waiting for holiday data to load...');
    await page.waitForTimeout(2000);

    const totalAllowance = await page.locator('#total-allowance').textContent();
    console.log(`   ✓ Total allowance displayed: ${totalAllowance}`);

    // Take another screenshot after data loads
    await page.screenshot({ path: 'holiday_redesign_with_data.png' });

    // Test date picker functionality
    console.log('7. Testing date picker functionality...');
    await page.locator('#from-date').fill('2025-01-15');
    await page.locator('#to-date').fill('2025-01-17');
    await page.click('#calculate-btn');
    await page.waitForTimeout(1000);

    const calculationVisible = await page.locator('#calculation-result').isVisible();
    console.log(`   ✓ Calculation result visible: ${calculationVisible}`);

    // Take final screenshot
    await page.screenshot({ path: 'holiday_redesign_final.png' });

    console.log('✅ Test completed successfully!');
    console.log('📸 Screenshots saved:');
    console.log('   - holiday_redesign_result.png (initial load)');
    console.log('   - holiday_redesign_with_data.png (after data loads)');
    console.log('   - holiday_redesign_final.png (with calculation)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'holiday_redesign_error.png' });
    console.log('📸 Error screenshot saved: holiday_redesign_error.png');
  } finally {
    await browser.close();
  }
}

testHolidayRedesign();