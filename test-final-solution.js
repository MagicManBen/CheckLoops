import { chromium } from 'playwright';

async function testFinalSolution() {
  console.log('🎯 FINAL TEST: Login with local Supabase bundle...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor console
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      if (text.includes('Content Security Policy')) {
        console.log(`❌ CSP ERROR: ${text}`);
      } else if (text.includes('Failed to load')) {
        console.log(`❌ LOAD ERROR: ${text}`);
      } else {
        console.log(`❌ ERROR: ${text}`);
      }
    } else if (text.includes('Supabase') || text.includes('CONFIG') || text.includes('Login')) {
      console.log(`ℹ️  ${text}`);
    }
  });

  try {
    console.log('1️⃣ Navigating to live site...');
    await page.goto('https://checkloops.co.uk/home.html', {
      waitUntil: 'networkidle',
      timeout: 20000
    });

    console.log('2️⃣ Checking if Supabase loads locally...');
    await page.waitForTimeout(3000);

    const status = await page.evaluate(() => {
      return {
        config: typeof CONFIG !== 'undefined',
        supabaseGlobal: typeof supabase !== 'undefined',
        windowSupabase: typeof window.supabase !== 'undefined',
        supabaseClient: typeof window.supabaseClient !== 'undefined',
        createClient: typeof window.supabase?.createClient === 'function'
      };
    });

    console.log('📊 Status check:');
    console.log(`   CONFIG loaded: ${status.config}`);
    console.log(`   Global supabase: ${status.supabaseGlobal}`);
    console.log(`   window.supabase: ${status.windowSupabase}`);
    console.log(`   window.supabaseClient: ${status.supabaseClient}`);
    console.log(`   createClient function: ${status.createClient}`);

    if (!status.windowSupabase && !status.supabaseGlobal) {
      console.log('❌ Supabase still not loading - checking for script errors...');
      await browser.close();
      return;
    }

    console.log('✅ Supabase appears to be loaded!');
    console.log('3️⃣ Testing login process...');

    // Fill login form
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('#password', 'Hello1!');

    console.log('4️⃣ Submitting login...');
    await page.click('#signin-form button[type="submit"]');

    console.log('5️⃣ Waiting for authentication...');

    // Wait for result
    try {
      await page.waitForFunction(() => {
        const error = document.getElementById('auth-error');
        const success = document.getElementById('auth-success');
        return (error && error.style.display !== 'none' && error.textContent.trim()) ||
               (success && success.style.display !== 'none' && success.textContent.trim()) ||
               window.location.href.includes('staff.html') ||
               window.location.href.includes('admin');
      }, { timeout: 20000 });

      const finalUrl = page.url();
      const errorMsg = await page.locator('#auth-error').textContent();
      const successMsg = await page.locator('#auth-success').textContent();

      console.log('\n🏁 FINAL RESULTS:');
      console.log(`Current URL: ${finalUrl}`);

      if (finalUrl.includes('staff.html')) {
        console.log('🎉 SUCCESS! Login worked and redirected to staff portal!');
      } else if (errorMsg && errorMsg.trim()) {
        console.log(`❌ Login failed: ${errorMsg}`);
      } else if (successMsg && successMsg.trim()) {
        console.log(`✅ ${successMsg}`);
      }

    } catch (timeoutError) {
      console.log('⏰ Timeout waiting for login response');
      console.log(`Current URL: ${page.url()}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n⏳ Keeping browser open for 5 seconds to observe...');
  await page.waitForTimeout(5000);
  await browser.close();
}

// Wait for deployment then test
console.log('⏳ Waiting 45 seconds for GitHub Pages deployment...');
setTimeout(testFinalSolution, 45000);