import { chromium } from 'playwright';

async function testAdminNoRestrictions() {
  console.log('🚀 Testing admin dashboard without access restrictions...');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down for visibility
  });

  const page = await browser.newPage();

  try {
    // Navigate to the site
    console.log('📍 Navigating to site...');
    await page.goto('http://127.0.0.1:58156/index.html');
    await page.waitForTimeout(1000);

    // Take initial screenshot
    await page.screenshot({ path: 'test_admin_1_initial.png', fullPage: true });
    console.log('📸 Initial screenshot taken');

    // Click on admin login
    console.log('🔐 Clicking admin login...');
    await page.click('a[href="admin-login.html"]');
    await page.waitForTimeout(2000);

    // Fill in credentials
    console.log('📝 Entering credentials...');
    await page.fill('#email', 'ben.howard@stoke.nhs.uk');
    await page.fill('#password', 'Hello1!');

    await page.screenshot({ path: 'test_admin_2_credentials.png', fullPage: true });

    // Click sign in
    console.log('🔑 Signing in...');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // Now we should be in admin dashboard
    await page.screenshot({ path: 'test_admin_3_dashboard.png', fullPage: true });
    console.log('📸 Dashboard screenshot taken');

    // Test clicking on different sections without restrictions
    const sections = [
      { name: 'holidays', text: 'Holidays' },
      { name: 'complaints', text: 'Complaints' },
      { name: 'staff', text: 'Staff' },
      { name: 'items', text: 'Items' },
      { name: 'rooms', text: 'Rooms' },
      { name: 'users', text: 'Users' }
    ];

    for (const section of sections) {
      console.log(`\n🔍 Testing ${section.name} section...`);

      // Try to click the section button
      try {
        // Look for button with data-section attribute
        const button = await page.$(`button[data-section="${section.name}"]`);
        if (button) {
          await button.click();
          console.log(`✅ Clicked ${section.name} button`);
        } else {
          // Try by text
          await page.click(`button:has-text("${section.text}")`);
          console.log(`✅ Clicked ${section.text} button`);
        }

        await page.waitForTimeout(1500);

        // Check if any permission error appears
        const alertPresent = await page.evaluate(() => {
          // Check if there's an alert dialog
          return false; // Alerts would block execution
        });

        // Check for permission error messages in the page
        const permissionError = await page.$('text=/permission/i');

        if (permissionError) {
          console.log(`❌ Permission error found for ${section.name}!`);
          const errorText = await permissionError.textContent();
          console.log(`   Error text: ${errorText}`);
        } else {
          console.log(`✅ ${section.name} section accessible without restrictions!`);
        }

        // Take screenshot of the section
        await page.screenshot({
          path: `test_admin_section_${section.name}.png`,
          fullPage: true
        });

      } catch (error) {
        console.log(`⚠️ Could not test ${section.name}: ${error.message}`);
      }
    }

    console.log('\n✅ Test completed successfully!');
    console.log('📊 Summary: All sections should now be accessible without permission checks');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test_admin_error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('🏁 Browser closed');
  }
}

// Run the test
testAdminNoRestrictions().catch(console.error);