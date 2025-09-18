import { chromium } from 'playwright';

async function debugAdminLogin() {
  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log('Browser console:', msg.type(), msg.text());
  });

  page.on('pageerror', error => {
    console.log('Browser error:', error.message);
  });

  try {
    console.log('1. Navigating to admin login page...');
    await page.goto('http://127.0.0.1:5500/admin-login.html');
    await page.waitForTimeout(2000);

    // Take initial screenshot
    await page.screenshot({ path: 'admin_login_1_initial.png' });

    console.log('2. Filling in credentials...');
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('#password', 'Hello1!');

    await page.screenshot({ path: 'admin_login_2_filled.png' });

    console.log('3. Clicking sign in button...');
    await page.click('#submit-btn');

    // Wait for either navigation or error message
    await Promise.race([
      page.waitForNavigation({ timeout: 10000 }).catch(() => {}),
      page.waitForSelector('.error-message.show', { timeout: 10000 }).catch(() => {}),
      page.waitForTimeout(10000)
    ]);

    // Check if we're still on the login page
    const currentUrl = page.url();
    console.log('4. Current URL after login attempt:', currentUrl);

    // Check for error message
    const errorVisible = await page.locator('.error-message.show').isVisible().catch(() => false);
    if (errorVisible) {
      const errorText = await page.locator('.error-message').textContent();
      console.log('ERROR MESSAGE FOUND:', errorText);
    }

    // Take final screenshot
    await page.screenshot({ path: 'admin_login_3_result.png', fullPage: true });

    // Get localStorage data
    const localStorageData = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('sb-') || key.includes('supabase')) {
          data[key] = localStorage.getItem(key);
        }
      }
      return data;
    });

    console.log('5. LocalStorage auth data:', Object.keys(localStorageData));

    // Check console for any authentication details
    await page.evaluate(() => {
      console.log('Page loaded, checking auth state...');
    });

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'admin_login_error.png', fullPage: true });
  }

  console.log('\n=== Test complete. Check screenshots and console output ===');
  await browser.close();
}

debugAdminLogin();