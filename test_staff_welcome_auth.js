import { chromium } from 'playwright';

async function testStaffWelcomeAuth() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log(`Browser console [${msg.type()}]:`, msg.text());
  });
  
  // Catch errors
  page.on('pageerror', error => {
    console.error('Page error:', error.message);
  });
  
  try {
    console.log('\n📍 Testing Staff Welcome Authentication...\n');
    
    // Navigate to the login page
    await page.goto('http://127.0.0.1:54341/index.html');
    await page.waitForLoadState('networkidle');
    
    // Check if we need to login or if we're already logged in
    const hasEmailField = await page.locator('#email').count() > 0;
    
    if (hasEmailField) {
      // Login
      console.log('1. Logging in...');
      await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
      await page.locator('input[type="password"]').fill('Hello1!');
      await page.click('button:has-text("Sign In")');
    } else {
      // Check for email input field
      const hasEmailInput = await page.locator('input[type="email"]').count() > 0;
      if (hasEmailInput) {
        console.log('1. Logging in with email input field...');
        await page.locator('input[type="email"]').fill('ben.howard@stoke.nhs.uk');
        await page.locator('input[type="password"]').fill('Hello1!');
        await page.click('button:has-text("Sign In")');
      } else {
        console.log('1. Already logged in or different login page structure');
      }
    }
    
    // Wait for redirect to staff page
    await page.waitForTimeout(3000);
    
    // Check if we're on staff.html or another page
    const currentUrl = page.url();
    console.log('2. Current URL after login:', currentUrl);
    
    // Navigate to staff-welcome.html
    console.log('3. Navigating to staff-welcome.html...');
    await page.goto('http://127.0.0.1:54341/staff-welcome.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check authentication status
    console.log('\n4. Checking authentication status...');
    
    // Look for user information display elements
    const welcomeTitle = await page.locator('#welcome-title').textContent().catch(() => null);
    console.log('   Welcome title:', welcomeTitle || 'NOT FOUND');
    
    const sitePill = await page.locator('#site-pill').textContent().catch(() => null);
    console.log('   Site pill:', sitePill || 'NOT FOUND');
    
    const emailPill = await page.locator('#email-pill').textContent().catch(() => null);
    console.log('   Email pill:', emailPill || 'NOT FOUND');
    
    const rolePill = await page.locator('#role-pill').textContent().catch(() => null);
    console.log('   Role pill:', rolePill || 'NOT FOUND');
    
    // Check if user profile is being loaded
    console.log('\n5. Checking user profile loading...');
    const profileInfo = await page.evaluate(async () => {
      try {
        // Check if supabase is available
        if (typeof supabase === 'undefined') {
          return { error: 'Supabase not defined' };
        }
        
        // Get session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return { error: 'No session found' };
        }
        
        // Get user info
        const user = session.user;
        
        // Try to get profile from profiles table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        // Try to get staff_app_welcome data
        const { data: staffWelcome, error: staffError } = await supabase
          .from('staff_app_welcome')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        // Check if getUserProfile function exists
        const hasGetUserProfile = typeof getUserProfile !== 'undefined';
        
        let userProfile = null;
        if (hasGetUserProfile) {
          try {
            userProfile = await getUserProfile(supabase, user);
          } catch (e) {
            console.error('getUserProfile error:', e);
          }
        }
        
        return {
          userId: user.id,
          email: user.email,
          profile: profile,
          profileError: profileError?.message,
          staffWelcome: staffWelcome,
          staffError: staffError?.message,
          hasGetUserProfile: hasGetUserProfile,
          userProfile: userProfile,
          metadata: user.raw_user_meta_data || user.user_metadata
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    console.log('\n📊 Profile Information:');
    console.log(JSON.stringify(profileInfo, null, 2));
    
    // Check for any error messages on the page
    const errorMessages = await page.locator('.error, .alert-error').allTextContents().catch(() => []);
    if (errorMessages.length > 0) {
      console.log('\n⚠️ Error messages found:');
      errorMessages.forEach(msg => console.log('  -', msg));
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'test_staff_welcome_auth.png', fullPage: true });
    console.log('\n✅ Screenshot saved as test_staff_welcome_auth.png');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ path: 'test_staff_welcome_error.png' });
  } finally {
    await browser.close();
  }
}

testStaffWelcomeAuth();