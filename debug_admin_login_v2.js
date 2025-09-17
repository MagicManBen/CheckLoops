import { chromium } from 'playwright';

async function debugAdminLogin() {
  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture all console messages
  const consoleLogs = [];
  page.on('console', msg => {
    const logText = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(logText);
    console.log('Browser:', logText);
  });

  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });

  // Capture network requests
  page.on('request', request => {
    if (request.url().includes('supabase')) {
      console.log('Network request:', request.method(), request.url());
    }
  });

  page.on('response', response => {
    if (response.url().includes('supabase')) {
      console.log('Network response:', response.status(), response.url());
    }
  });

  try {
    console.log('\n=== STEP 1: Navigate to admin login ===');
    await page.goto('http://127.0.0.1:5500/admin-login.html');
    await page.waitForTimeout(2000);

    console.log('\n=== STEP 2: Fill credentials ===');
    // Clear any existing values first
    await page.locator('#email').clear();
    await page.locator('#password').clear();

    // Type the credentials
    await page.locator('#email').type('benhowardmagic@hotmail.com');
    await page.locator('#password').type('Hello1!');

    // Verify the values were entered
    const emailValue = await page.locator('#email').inputValue();
    const passwordValue = await page.locator('#password').inputValue();
    console.log('Email entered:', emailValue);
    console.log('Password entered:', passwordValue ? '******' : 'EMPTY');

    await page.screenshot({ path: 'admin_debug_1_filled.png' });

    console.log('\n=== STEP 3: Submit form ===');
    // Try clicking the submit button
    await page.locator('#submit-btn').click();

    console.log('Waiting for response...');

    // Wait longer for any response
    await page.waitForTimeout(5000);

    // Check current URL
    const currentUrl = page.url();
    console.log('\n=== STEP 4: Check results ===');
    console.log('Current URL:', currentUrl);

    // Check for error messages
    const errorElement = page.locator('.error-message');
    const errorExists = await errorElement.count() > 0;

    if (errorExists) {
      const isVisible = await errorElement.isVisible();
      if (isVisible) {
        const errorText = await errorElement.textContent();
        console.log('ERROR MESSAGE VISIBLE:', errorText);
      } else {
        console.log('Error element exists but not visible');
      }
    }

    // Check button state
    const buttonText = await page.locator('#submit-btn').textContent();
    const buttonDisabled = await page.locator('#submit-btn').isDisabled();
    console.log('Button text:', buttonText);
    console.log('Button disabled:', buttonDisabled);

    await page.screenshot({ path: 'admin_debug_2_result.png', fullPage: true });

    // Check localStorage
    const authData = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
      }
      return data;
    });

    console.log('\n=== LocalStorage data ===');
    Object.keys(authData).forEach(key => {
      if (key.includes('sb-') || key.includes('supabase')) {
        console.log(`${key}: ${authData[key]?.substring(0, 50)}...`);
      }
    });

    // Try to get any JavaScript errors from the page
    const pageErrors = await page.evaluate(() => {
      return window.__errors || [];
    });

    if (pageErrors.length > 0) {
      console.log('\n=== Page errors ===');
      pageErrors.forEach(err => console.log(err));
    }

    console.log('\n=== All console logs ===');
    consoleLogs.forEach(log => console.log(log));

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('\nTest error:', error);
    await page.screenshot({ path: 'admin_debug_error.png', fullPage: true });
  }

  console.log('\n=== Debug complete ===');
  await browser.close();
}

debugAdminLogin();