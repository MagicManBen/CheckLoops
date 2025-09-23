import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture ALL console messages
  const allMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    allMessages.push(text);
    // Show important messages immediately
    if (text.includes('Bootstrap') || text.includes('bootstrap') ||
        text.includes('loadContext') || text.includes('Setting user') ||
        text.includes('🚀') || text.includes('📍') || text.includes('Admin Dashboard:')) {
      console.log(`[CONSOLE] ${text}`);
    }
  });

  console.log('Testing admin dashboard initialization...\n');

  // Navigate to admin login
  await page.goto('https://checkloops.co.uk/admin-login.html');
  await page.waitForSelector('#email', { timeout: 10000 });
  await page.fill('#email', 'benhowardmagic@hotmail.com');
  await page.fill('#password', 'Looptestadmin1');
  await page.click('button[type="submit"]');

  // Wait for redirect
  await page.waitForURL('**/admin-dashboard.html', { timeout: 10000 });
  console.log('\n✓ On admin dashboard\n');

  // Wait longer for bootstrap
  await page.waitForTimeout(8000);

  // Check if bootstrap is defined
  const bootstrapDefined = await page.evaluate(() => typeof window.bootstrap);
  console.log(`\nbootstrap function type: ${bootstrapDefined}`);

  // Try to call bootstrap manually if it exists
  if (bootstrapDefined === 'function') {
    console.log('Calling bootstrap manually...');
    await page.evaluate(() => window.bootstrap());
    await page.waitForTimeout(3000);
  }

  // Check final user display
  const userName = await page.locator('#user-name').textContent();
  const userRole = await page.locator('#user-role').textContent();
  console.log(`\nFinal display:`);
  console.log(`  User name: "${userName}"`);
  console.log(`  User role: "${userRole}"`);

  if (userName !== 'User') {
    console.log('\n✅ User data loaded successfully!');
  } else {
    console.log('\n❌ User data did not load');
    console.log('\nShowing last 20 console messages:');
    allMessages.slice(-20).forEach(msg => console.log(`  ${msg}`));
  }

  await browser.close();
})();