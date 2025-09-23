import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, devtools: true });
  const page = await browser.newPage();

  console.log('Testing admin login and user data display...');

  // Navigate to admin login
  await page.goto('https://checkloops.co.uk/admin-login.html');
  console.log('✓ Navigated to admin login');

  // Wait for page to load
  await page.waitForSelector('#email', { timeout: 10000 });

  // Fill login form
  await page.fill('#email', 'ben@laserlearningsolutions.co.uk');
  await page.fill('#password', 'Looptestadmin1');
  console.log('✓ Filled login credentials');

  // Click sign in
  await page.click('button[type="submit"]');
  console.log('✓ Clicked sign in button');

  // Wait for navigation to admin dashboard
  try {
    await page.waitForURL('**/admin-dashboard.html', { timeout: 10000 });
    console.log('✓ Redirected to admin dashboard');
  } catch (e) {
    console.log('❌ Not redirected to admin dashboard');
    console.log('Current URL:', page.url());

    // Check for error messages
    const errorMessage = await page.locator('#error-message').textContent();
    if (errorMessage) {
      console.log('Error message:', errorMessage);
    }

    await page.screenshot({ path: 'admin-login-error.png' });
    console.log('Screenshot saved as admin-login-error.png');
    await browser.close();
    process.exit(1);
  }

  // Wait for user data to load
  await page.waitForTimeout(2000); // Give time for data to load

  // Check user display
  const userName = await page.locator('#user-name').textContent();
  console.log(`\nUser name displayed: "${userName}"`);

  if (userName && userName !== 'User') {
    console.log('✅ SUCCESS: User data is loading correctly!');
    console.log(`   Displayed user: ${userName}`);
  } else {
    console.log('❌ ISSUE: User data not loading - still shows "User"');

    // Check console for errors
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(`${msg.type()}: ${msg.text()}`));
    await page.waitForTimeout(1000);

    if (consoleMessages.length > 0) {
      console.log('\nConsole messages:');
      consoleMessages.forEach(msg => console.log(`  ${msg}`));
    }
  }

  // Take a screenshot for verification
  await page.screenshot({ path: 'admin-dashboard-user-test.png', fullPage: false });
  console.log('\n📸 Screenshot saved as admin-dashboard-user-test.png');

  await browser.close();
})();