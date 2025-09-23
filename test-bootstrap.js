import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Bootstrap') || text.includes('bootstrap') ||
        text.includes('loadContext') || text.includes('Setting user') ||
        text.includes('🚀') || text.includes('📍')) {
      console.log(text);
    }
  });

  console.log('Testing if bootstrap runs...\n');

  // Navigate directly to admin dashboard with session
  await page.goto('https://checkloops.co.uk/admin-login.html');
  await page.waitForSelector('#email', { timeout: 10000 });
  await page.fill('#email', 'benhowardmagic@hotmail.com');
  await page.fill('#password', 'Looptestadmin1');
  await page.click('button[type="submit"]');

  // Wait for redirect
  await page.waitForURL('**/admin-dashboard.html', { timeout: 10000 });
  console.log('On admin dashboard, waiting for bootstrap...\n');

  // Wait a bit for bootstrap to run
  await page.waitForTimeout(5000);

  // Check final user display
  const userName = await page.locator('#user-name').textContent();
  console.log(`\nFinal user display: "${userName}"`);

  if (userName !== 'User') {
    console.log('✅ Bootstrap ran and loaded user data!');
  } else {
    console.log('❌ Bootstrap did not run or failed to load user data');
  }

  await browser.close();
})();