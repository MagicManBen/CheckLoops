import { chromium } from 'playwright';

async function testWelcomeIssue() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('Error') || msg.text().includes('error')) {
      console.log(`Browser [${msg.type()}]:`, msg.text());
    }
  });
  
  try {
    console.log('\n📍 Testing Staff Welcome Issue...\n');
    
    // Step 1: Navigate directly to home.html
    console.log('1. Navigating to home.html...');
    await page.goto('http://127.0.0.1:54341/home.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Step 2: Login with the specific credentials
    console.log('2. Logging in with benhowardmagic@hotmail.com...');
    
    // Try to find the email field
    const emailInput = await page.locator('input[type="email"], #email').first();
    await emailInput.fill('benhowardmagic@hotmail.com');
    
    const passwordInput = await page.locator('input[type="password"]').first();
    await passwordInput.fill('Hello1!');
    
    // Click sign in button
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation
    await page.waitForTimeout(5000);
    
    // Step 3: Check if we're on staff.html
    const currentUrl = page.url();
    console.log('3. Current URL after login:', currentUrl);
    
    // Take screenshot of staff page
    await page.screenshot({ path: 'test_staff_page.png' });
    console.log('   Screenshot saved: test_staff_page.png');
    
    // Get user info before going to welcome
    console.log('\n4. Checking user state BEFORE clicking welcome...');
    const beforeWelcome = await page.evaluate(async () => {
      try {
        if (typeof supabase === 'undefined') {
          return { error: 'Supabase not defined' };
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return { error: 'No session found' };
        }
        
        const user = session.user;
        
        // Get profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        // Get staff_app_welcome data
        const { data: staffWelcome } = await supabase
          .from('staff_app_welcome')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        return {
          userId: user.id,
          email: user.email,
          hasSession: true,
          profile: profile,
          staffWelcome: staffWelcome,
          metadata: user.user_metadata || user.raw_user_meta_data
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    console.log('   User state before:', JSON.stringify(beforeWelcome, null, 2));
    
    // Step 4: Click on the Welcome button
    console.log('\n5. Looking for Welcome button/link...');
    
    // Try different selectors for the welcome button
    const welcomeSelectors = [
      'button:has-text("Welcome")',
      'a:has-text("Welcome")',
      '[data-section="welcome"]',
      '[onclick*="welcome"]',
      'button[onclick*="welcome"]',
      '.nav-link:has-text("Welcome")',
      '.seg-nav button:has-text("Welcome")'
    ];
    
    let welcomeClicked = false;
    for (const selector of welcomeSelectors) {
      const element = await page.locator(selector).first();
      const count = await element.count();
      if (count > 0) {
        console.log(`   Found welcome element with selector: ${selector}`);
        await element.click();
        welcomeClicked = true;
        break;
      }
    }
    
    if (!welcomeClicked) {
      console.log('   ⚠️ Could not find Welcome button, navigating directly...');
      await page.goto('http://127.0.0.1:54341/staff-welcome.html');
    }
    
    // Wait for navigation
    await page.waitForTimeout(5000);
    
    // Step 5: Check the welcome page
    console.log('\n6. On staff-welcome.html - checking status...');
    console.log('   Current URL:', page.url());
    
    // Check user state AFTER navigation
    const afterWelcome = await page.evaluate(async () => {
      try {
        if (typeof supabase === 'undefined') {
          return { error: 'Supabase not defined' };
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return { error: 'No session found - USER LOGGED OUT!' };
        }
        
        const user = session.user;
        
        // Get profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        // Get staff_app_welcome data  
        const { data: staffWelcome } = await supabase
          .from('staff_app_welcome')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        // Check if getUserProfile is available
        let userProfile = null;
        if (typeof getUserProfile !== 'undefined') {
          try {
            userProfile = await getUserProfile(supabase, user);
          } catch (e) {
            console.error('getUserProfile error:', e);
          }
        }
        
        return {
          userId: user.id,
          email: user.email,
          hasSession: true,
          profile: profile,
          staffWelcome: staffWelcome,
          userProfile: userProfile,
          metadata: user.user_metadata || user.raw_user_meta_data
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    console.log('   User state after:', JSON.stringify(afterWelcome, null, 2));
    
    // Check for visible elements
    const welcomeTitle = await page.locator('#welcome-title').textContent().catch(() => 'NOT FOUND');
    const nickname = await page.locator('#nickname').inputValue().catch(() => 'NOT FOUND');
    const sitePill = await page.locator('#site-pill').textContent().catch(() => 'NOT FOUND');
    const emailPill = await page.locator('#email-pill').textContent().catch(() => 'NOT FOUND');
    const rolePill = await page.locator('#role-pill').textContent().catch(() => 'NOT FOUND');
    
    console.log('\n7. Page elements:');
    console.log('   Welcome title:', welcomeTitle);
    console.log('   Nickname field:', nickname);
    console.log('   Site pill:', sitePill);
    console.log('   Email pill:', emailPill);
    console.log('   Role pill:', rolePill);
    
    // Take final screenshot
    await page.screenshot({ path: 'test_welcome_page.png', fullPage: true });
    console.log('\n✅ Screenshot saved: test_welcome_page.png');
    
    // Check for any auth redirects or errors
    const finalUrl = page.url();
    if (finalUrl.includes('index.html') || finalUrl.includes('login') || finalUrl.includes('home.html')) {
      console.log('\n❌ ERROR: User was redirected to login page!');
      console.log('   This confirms the logout issue.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ path: 'test_welcome_error.png' });
  } finally {
    console.log('\nPress Ctrl+C to close the browser...');
    // Keep browser open for manual inspection
    await new Promise(() => {});
  }
}

testWelcomeIssue();