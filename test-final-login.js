import { chromium } from 'playwright';

async function testFinalLogin() {
  console.log('🎯 Final test: Login on checkloops.co.uk with CSP fix...\n');

  const browser = await chromium.launch({
    headless: false, // Show browser
    slowMo: 500 // Slow actions for visibility
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor all console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ [CONSOLE ERROR]: ${msg.text()}`);
    } else if (msg.text().includes('CONFIG') || msg.text().includes('Supabase')) {
      console.log(`ℹ️  [CONSOLE]: ${msg.text()}`);
    }
  });

  try {
    console.log('1️⃣ Navigating to live site...');
    await page.goto('https://checkloops.co.uk/home.html', {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    console.log('2️⃣ Waiting for Supabase to load...');
    await page.waitForTimeout(3000);

    // Check if Supabase is now available
    const supabaseCheck = await page.evaluate(() => {
      return {
        configLoaded: typeof CONFIG !== 'undefined',
        supabaseAvailable: typeof window.supabase !== 'undefined',
        anonKey: typeof CONFIG !== 'undefined' ? CONFIG.SUPABASE_ANON_KEY?.substring(0, 50) + '...' : 'N/A'
      };
    });

    console.log(`Config loaded: ${supabaseCheck.configLoaded}`);
    console.log(`Supabase available: ${supabaseCheck.supabaseAvailable}`);
    console.log(`Anon key: ${supabaseCheck.anonKey}`);

    if (!supabaseCheck.supabaseAvailable) {
      console.log('❌ Supabase still not loading - CSP may still be blocking');
      await browser.close();
      return;
    }

    console.log('✅ Supabase loaded successfully!');
    console.log('3️⃣ Attempting login...');

    // Fill and submit login form
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('#password', 'Hello1!');

    // Click the specific Sign In button (first one)
    await page.click('#signin-form button[type="submit"]');

    console.log('4️⃣ Waiting for authentication response...');

    // Wait for either success or error
    await page.waitForFunction(() => {
      const errorEl = document.getElementById('auth-error');
      const successEl = document.getElementById('auth-success');
      return (errorEl && errorEl.style.display !== 'none' && errorEl.textContent.trim()) ||
             (successEl && successEl.style.display !== 'none' && successEl.textContent.trim()) ||
             window.location.href.includes('staff.html');
    }, { timeout: 15000 });

    const currentUrl = page.url();
    const errorMsg = await page.locator('#auth-error').textContent();
    const successMsg = await page.locator('#auth-success').textContent();

    if (currentUrl.includes('staff.html')) {
      console.log('🎉 SUCCESS! Login worked and redirected to staff portal!');
      console.log(`✅ Final URL: ${currentUrl}`);
    } else if (errorMsg && errorMsg.trim()) {
      console.log(`❌ Login failed with error: ${errorMsg}`);
    } else if (successMsg && successMsg.trim()) {
      console.log(`✅ Success message: ${successMsg}`);
      console.log('⏳ Waiting for redirect...');
      await page.waitForTimeout(2000);
      console.log(`📍 Final URL: ${page.url()}`);
    } else {
      console.log('❓ Unclear result - no error or success message');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  await page.waitForTimeout(3000); // Keep browser open to see result
  await browser.close();
}

// Wait for deployment then test
console.log('⏳ Waiting 45 seconds for GitHub Pages deployment...');
setTimeout(testFinalLogin, 45000);