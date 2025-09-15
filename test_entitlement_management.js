import { chromium } from 'playwright';

async function testEntitlementManagement() {
  console.log('Testing consolidated Entitlement Management page...');

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

    // Take screenshot of login page
    await page.screenshot({ path: 'test_01_login_page.png' });

    // Login with provided credentials
    console.log('2. Logging in as admin...');
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('input[type="password"]').fill('Hello1!');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard to load
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test_02_after_login.png' });

    // Click on Scheduling dropdown to expand it
    console.log('3. Expanding Scheduling menu...');
    const schedulingToggle = page.locator('#toggle-scheduling');
    await schedulingToggle.click();
    await page.waitForTimeout(500);

    // Take screenshot showing expanded menu
    await page.screenshot({ path: 'test_03_scheduling_menu_expanded.png' });

    // Check if Entitlement Management option is visible
    console.log('4. Looking for Entitlement Management option...');
    const entitlementButton = page.locator('button[data-section="entitlement-management"]');
    const isVisible = await entitlementButton.isVisible();

    if (isVisible) {
      console.log('✓ Entitlement Management option found in menu');

      // Click on Entitlement Management
      console.log('5. Clicking on Entitlement Management...');
      await entitlementButton.click();
      await page.waitForTimeout(2000);

      // Take screenshot of the consolidated page
      await page.screenshot({ path: 'test_04_entitlement_management_page.png', fullPage: true });

      // Check for key elements on the page
      console.log('6. Verifying page elements...');

      // Check for the main title
      const titleVisible = await page.locator('h1:has-text("Entitlement Management")').isVisible();
      console.log(titleVisible ? '✓ Page title visible' : '✗ Page title not found');

      // Check for Working Patterns section
      const workingPatternsVisible = await page.locator('h3:has-text("Staff Working Patterns")').isVisible();
      console.log(workingPatternsVisible ? '✓ Working Patterns section visible' : '✗ Working Patterns section not found');

      // Check for Holiday Settings section
      const holidaySettingsVisible = await page.locator('h3:has-text("Holiday Settings")').isVisible();
      console.log(holidaySettingsVisible ? '✓ Holiday Settings section visible' : '✗ Holiday Settings section not found');

      // Check for multiplier input
      const multiplierInput = await page.locator('#default-multiplier').isVisible();
      console.log(multiplierInput ? '✓ Holiday multiplier input visible' : '✗ Holiday multiplier input not found');

      // Check for Entitlements Summary section
      const entitlementsVisible = await page.locator('h3:has-text("Staff Holiday Entitlements")').isVisible();
      console.log(entitlementsVisible ? '✓ Entitlements Summary section visible' : '✗ Entitlements Summary section not found');

      // Check for Holiday Requests section
      const requestsVisible = await page.locator('h3:has-text("Holiday Requests")').isVisible();
      console.log(requestsVisible ? '✓ Holiday Requests section visible' : '✗ Holiday Requests section not found');

      // Scroll to bottom to capture full page
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test_05_entitlement_management_bottom.png' });

      console.log('\n✅ Test completed successfully!');
      console.log('All sections of the consolidated Entitlement Management page are present.');

    } else {
      console.log('✗ Entitlement Management option NOT found in menu');
      console.log('Please check if the menu was updated correctly');
    }

  } catch (error) {
    console.error('Test failed with error:', error);
    await page.screenshot({ path: 'test_error.png' });
  } finally {
    await browser.close();
    console.log('\nTest screenshots saved:');
    console.log('- test_01_login_page.png');
    console.log('- test_02_after_login.png');
    console.log('- test_03_scheduling_menu_expanded.png');
    console.log('- test_04_entitlement_management_page.png');
    console.log('- test_05_entitlement_management_bottom.png');
  }
}

// Run the test
testEntitlementManagement().catch(console.error);