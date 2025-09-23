import { chromium } from 'playwright';

async function testLiveLogin() {
  console.log('🔍 Testing live login on checkloops.co.uk...\n');

  const browser = await chromium.launch({
    headless: false, // Show browser for debugging
    slowMo: 1000 // Slow down actions
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor console messages
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type().toUpperCase()}]:`, msg.text());
  });

  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('supabase') || request.url().includes('auth')) {
      console.log(`[REQUEST]: ${request.method()} ${request.url()}`);
    }
  });

  // Monitor network responses
  page.on('response', response => {
    if (response.url().includes('supabase') || response.url().includes('auth')) {
      console.log(`[RESPONSE]: ${response.status()} ${response.url()}`);
    }
  });

  // Monitor JavaScript errors
  page.on('pageerror', error => {
    console.log(`[JS ERROR]:`, error.message);
  });

  try {
    console.log('1️⃣ Navigating to live site...');
    await page.goto('https://checkloops.co.uk/home.html', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('2️⃣ Waiting for page to load...');
    await page.waitForSelector('#email', { timeout: 10000 });

    console.log('3️⃣ Checking if config.js loaded...');
    const configLoaded = await page.evaluate(() => {
      return typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_ANON_KEY;
    });
    console.log(`Config loaded: ${configLoaded}`);

    if (configLoaded) {
      const anonKey = await page.evaluate(() => CONFIG.SUPABASE_ANON_KEY);
      console.log(`Anon key: ${anonKey.substring(0, 50)}...`);
    }

    console.log('4️⃣ Checking if Supabase client is available...');
    const supabaseAvailable = await page.evaluate(() => {
      return typeof window.supabase !== 'undefined';
    });
    console.log(`Supabase client available: ${supabaseAvailable}`);

    console.log('5️⃣ Filling in login form...');
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('#password', 'Hello1!');

    console.log('6️⃣ Clicking sign in button...');
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    console.log('7️⃣ Waiting for response...');

    // Wait for either success redirect or error message
    await page.waitForFunction(() => {
      const errorElement = document.getElementById('auth-error');
      const successElement = document.getElementById('auth-success');
      return (errorElement && errorElement.style.display !== 'none' && errorElement.textContent.trim()) ||
             (successElement && successElement.style.display !== 'none' && successElement.textContent.trim()) ||
             window.location.href.includes('staff.html');
    }, { timeout: 15000 });

    // Check current URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Check for error messages
    const errorMessage = await page.locator('#auth-error').textContent();
    const successMessage = await page.locator('#auth-success').textContent();

    if (errorMessage && errorMessage.trim()) {
      console.log(`❌ Error message: ${errorMessage}`);
    }

    if (successMessage && successMessage.trim()) {
      console.log(`✅ Success message: ${successMessage}`);
    }

    if (currentUrl.includes('staff.html')) {
      console.log('✅ Successfully redirected to staff portal!');
    } else {
      console.log('❌ No redirect occurred');
    }

    // Get final console logs
    console.log('\n8️⃣ Checking for any additional errors...');
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  await browser.close();
}

testLiveLogin();