import { chromium } from 'playwright';

async function testDirectAuth() {
  console.log('Testing direct authentication bypass...');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  try {
    const page = await browser.newPage();

    // Enable logging
    page.on('console', msg => console.log(`PAGE: ${msg.text()}`));
    page.on('pageerror', error => console.error(`PAGE ERROR: ${error.message}`));

    console.log('\n=== Loading home.html ===');
    await page.goto('http://127.0.0.1:58156/home.html?force=login');
    await page.waitForLoadState('networkidle');

    console.log('\n=== Manually setting up Supabase client ===');

    // Inject the Supabase configuration and client directly
    const authResult = await page.evaluate(async () => {
      try {
        // Load Supabase if not already loaded
        if (typeof createClient === 'undefined') {
          console.log('Loading Supabase module...');
          const script = document.createElement('script');
          script.type = 'module';
          script.textContent = `
            import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
            window.createClient = createClient;
          `;
          document.head.appendChild(script);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Set up configuration
        window.CONFIG = {
          SUPABASE_URL: 'https://unveoqnlqnobufhublyw.supabase.co',
          SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME'
        };

        console.log('Creating Supabase client...');
        if (typeof window.createClient !== 'undefined') {
          window.supabase = window.createClient(window.CONFIG.SUPABASE_URL, window.CONFIG.SUPABASE_ANON_KEY, {
            auth: {
              persistSession: true,
              autoRefreshToken: true,
              detectSessionInUrl: true,
              flowType: 'pkce'
            }
          });

          console.log('Testing authentication...');
          const { data, error } = await window.supabase.auth.signInWithPassword({
            email: 'benhowardmagic@hotmail.com',
            password: 'hello1!'
          });

          if (error) {
            return { success: false, error: error.message, data: null };
          } else {
            return { success: true, error: null, data: { userEmail: data.user?.email } };
          }
        } else {
          return { success: false, error: 'createClient not available after loading', data: null };
        }

      } catch (e) {
        return { success: false, error: e.message, data: null };
      }
    });

    console.log('\n=== Authentication Result ===');
    console.log('Success:', authResult.success);
    console.log('Error:', authResult.error);
    console.log('Data:', authResult.data);

    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'direct_auth_test.png' });

    if (authResult.success) {
      console.log('✅ AUTHENTICATION SUCCESSFUL!');
      console.log('The credentials benhowardmagic@hotmail.com / hello1! are correct.');

      // Check if user gets redirected
      await page.waitForTimeout(2000);
      const finalUrl = page.url();
      console.log('Final URL:', finalUrl);

      if (finalUrl.includes('staff.html') || finalUrl.includes('staff-welcome.html')) {
        console.log('✅ User properly redirected to staff area');
      }
    } else {
      console.log('❌ AUTHENTICATION FAILED');
      if (authResult.error.includes('Invalid login credentials')) {
        console.log('💡 This suggests the password might be different or the email might not exist.');
        console.log('💡 The user exists in the database but the password might not be "hello1!"');
      } else {
        console.log('💡 Error details:', authResult.error);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
    console.log('\n✅ Test completed.');
  }
}

testDirectAuth().catch(console.error);