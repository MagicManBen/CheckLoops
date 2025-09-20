import { chromium } from 'playwright';

async function testWithLogs() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== TEST WITH CONSOLE LOGGING ===\n');

  // Capture ALL console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    // Show auth-related logs immediately
    if (text.includes('Auth') || text.includes('bypass') || text.includes('role') || text.includes('admin')) {
      console.log('[Browser]:', text);
    }
  });

  // Capture errors
  page.on('pageerror', err => {
    console.log('[Browser Error]:', err.message);
  });

  try {
    // 1. Go directly to staff.html (assuming already logged in)
    console.log('1. Going to home.html to login...');
    await page.goto('file:///Users/benhoward/Desktop/CheckLoop/CheckLoops/home.html');
    await page.waitForTimeout(2000);

    // 2. Login
    console.log('2. Logging in...');
    await page.fill('input[type="email"]', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);

    // 3. Navigate to staff.html
    console.log('3. Going to staff.html...');
    await page.goto('file:///Users/benhoward/Desktop/CheckLoop/CheckLoops/staff.html');
    await page.waitForTimeout(5000);

    // 4. Show all captured console logs
    console.log('\n=== ALL CONSOLE LOGS ===');
    consoleLogs.forEach(log => console.log(log));

    // 5. Check what's displayed
    console.log('\n=== UI STATE ===');
    try {
      const badge = await page.locator('#role-pill').textContent();
      console.log('Role badge:', badge);
    } catch (e) {
      console.log('No role badge found');
    }

    // 6. Try to execute getUserRole in browser context
    console.log('\n=== CHECKING getUserRole IN BROWSER ===');
    try {
      const roleCheck = await page.evaluate(async () => {
        // Check if auth-core functions are available
        if (window.getUserRole) {
          const role = await window.getUserRole();
          return { hasFunction: true, role };
        }
        return { hasFunction: false };
      });
      console.log('getUserRole result:', roleCheck);
    } catch (e) {
      console.log('Could not check getUserRole:', e.message);
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    console.log('\nKeeping browser open for 15 seconds...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

testWithLogs().catch(console.error);