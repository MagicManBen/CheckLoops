import { chromium } from 'playwright';

async function testSpecificLogin() {
  console.log('Testing specific credentials: benhowardmagic@hotmail.com / hello1!');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1500 // Slow down to observe
  });

  try {
    const page = await browser.newPage();

    // Enable detailed console logging
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('auth') || msg.text().includes('Supabase')) {
        console.log(`PAGE: ${msg.type().toUpperCase()}: ${msg.text()}`);
      }
    });
    page.on('pageerror', error => console.error(`PAGE ERROR: ${error.message}`));

    console.log('\n=== Step 1: Load home.html with force login ===');
    await page.goto('http://127.0.0.1:58156/home.html?force=login');
    await page.waitForLoadState('networkidle');

    console.log('\n=== Step 2: Check if config.js is loaded ===');
    const configCheck = await page.evaluate(() => {
      return {
        hasWindow: typeof window !== 'undefined',
        hasConfig: typeof window.CONFIG !== 'undefined',
        config: window.CONFIG || null,
        hasCreateClient: typeof createClient !== 'undefined'
      };
    });
    console.log('Config check:', JSON.stringify(configCheck, null, 2));

    // If config is missing, let's check if we can load it manually
    if (!configCheck.hasConfig) {
      console.log('\n=== Step 3: Manually loading config.js ===');
      try {
        await page.addScriptTag({ path: './config.js' });
        const newConfigCheck = await page.evaluate(() => ({
          hasConfig: typeof window.CONFIG !== 'undefined',
          config: window.CONFIG || null
        }));
        console.log('After manual load:', newConfigCheck);
      } catch (e) {
        console.log('Failed to load config.js:', e.message);
      }
    }

    console.log('\n=== Step 4: Check Supabase module loading ===');
    const supabaseCheck = await page.evaluate(() => {
      return {
        hasCreateClient: typeof createClient !== 'undefined',
        hasSupabase: typeof window.supabase !== 'undefined',
        moduleError: window.moduleLoadError || null
      };
    });
    console.log('Supabase check:', supabaseCheck);

    console.log('\n=== Step 5: Attempt login with exact credentials ===');

    // Fill in the specific credentials (note: lowercase hello1!)
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('hello1!');

    console.log('✅ Credentials filled in');
    await page.screenshot({ path: 'before_login_attempt.png' });

    // Submit the form
    console.log('🔑 Submitting login form...');
    await page.click('button[type="submit"]:has-text("Sign In")');

    // Wait for response
    await page.waitForTimeout(4000);

    // Check result
    const loginResult = await page.evaluate(() => {
      const errorEl = document.getElementById('auth-error');
      const successEl = document.getElementById('auth-success');
      return {
        currentUrl: window.location.href,
        errorText: errorEl ? errorEl.textContent.trim() : null,
        successText: successEl ? successEl.textContent.trim() : null,
        errorVisible: errorEl ? errorEl.style.display !== 'none' : false,
        successVisible: successEl ? successEl.style.display !== 'none' : false
      };
    });

    console.log('\n=== Login Result ===');
    console.log('Current URL:', loginResult.currentUrl);
    console.log('Error message:', loginResult.errorText);
    console.log('Success message:', loginResult.successText);
    console.log('Error visible:', loginResult.errorVisible);
    console.log('Success visible:', loginResult.successVisible);

    await page.screenshot({ path: 'after_login_attempt.png' });

    if (loginResult.currentUrl.includes('staff.html') || loginResult.currentUrl.includes('staff-welcome.html')) {
      console.log('✅ LOGIN SUCCESSFUL! Redirected to staff area.');
    } else if (loginResult.errorText) {
      console.log('❌ LOGIN FAILED:', loginResult.errorText);

      // Let's check the network requests to see what's happening
      console.log('\n=== Step 6: Check network activity ===');
      const networkLogs = await page.evaluate(() => {
        // Try to get any network errors from the console
        return window.networkErrors || [];
      });
      console.log('Network logs:', networkLogs);

    } else {
      console.log('⚠️ Unexpected state - no clear success or error');
    }

    // Final check of authentication state
    console.log('\n=== Step 7: Final auth state check ===');
    const finalAuthCheck = await page.evaluate(async () => {
      try {
        if (typeof window.supabase !== 'undefined') {
          const { data } = await window.supabase.auth.getSession();
          return {
            hasSession: !!data.session,
            userEmail: data.session?.user?.email || null,
            error: null
          };
        } else {
          return { error: 'Supabase client not available' };
        }
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log('Final auth state:', finalAuthCheck);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
    console.log('\n✅ Test completed. Check screenshots: before_login_attempt.png and after_login_attempt.png');
  }
}

testSpecificLogin().catch(console.error);