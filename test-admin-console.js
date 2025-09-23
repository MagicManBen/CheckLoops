import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, devtools: true });
  const page = await browser.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push(`[${type.toUpperCase()}] ${text}`);
    console.log(`[${type.toUpperCase()}] ${text}`);
  });

  console.log('Testing admin login with console monitoring...\n');

  // Navigate to admin login
  await page.goto('https://checkloops.co.uk/admin-login.html');
  console.log('✓ Navigated to admin login\n');

  // Wait for page to load
  await page.waitForSelector('#email', { timeout: 10000 });

  // Fill login form with correct admin credentials
  await page.fill('#email', 'benhowardmagic@hotmail.com');
  await page.fill('#password', 'Looptestadmin1');
  console.log('✓ Filled login credentials\n');

  // Click sign in
  await page.click('button[type="submit"]');
  console.log('✓ Clicked sign in button\n');

  // Wait for navigation to admin dashboard
  try {
    await page.waitForURL('**/admin-dashboard.html', { timeout: 10000 });
    console.log('✓ Redirected to admin dashboard\n');
  } catch (e) {
    console.log('❌ Not redirected to admin dashboard');
    console.log('Current URL:', page.url());
    await browser.close();
    process.exit(1);
  }

  // Wait for data to load
  console.log('Waiting for page to fully load...\n');
  await page.waitForTimeout(3000);

  // Check user display
  const userName = await page.locator('#user-name').textContent();
  const userRole = await page.locator('#user-role').textContent();

  console.log('\n=== USER DISPLAY ===');
  console.log(`User name: "${userName}"`);
  console.log(`User role: "${userRole}"`);

  if (userName && userName !== 'User') {
    console.log('\n✅ SUCCESS: User data is loading correctly!');
  } else {
    console.log('\n❌ ISSUE: User data not loading properly');
  }

  // Take a screenshot
  await page.screenshot({ path: 'admin-console-test.png', fullPage: false });
  console.log('\n📸 Screenshot saved as admin-console-test.png');

  // Print all console messages
  console.log('\n=== ALL CONSOLE MESSAGES ===');
  consoleMessages.forEach(msg => console.log(msg));

  // Don't keep browser open to avoid timeout
  // await page.waitForTimeout(5000);

  await browser.close();
})();