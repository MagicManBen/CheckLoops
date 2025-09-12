import { chromium } from 'playwright';

async function testWelcomeFix() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  
  try {
    console.log('\n✅ Testing Staff Welcome Fix...\n');
    
    // Step 1: Go directly to home.html
    console.log('1. Navigating to home.html...');
    await page.goto('http://127.0.0.1:54341/home.html');
    await page.waitForTimeout(2000);
    
    // Step 2: Login
    console.log('2. Logging in...');
    await page.fill('input[type="email"]', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    console.log('3. Current URL:', page.url());
    
    // Step 3: Navigate to staff-welcome.html
    console.log('4. Going to staff-welcome.html...');
    
    // Try clicking Welcome button first
    try {
      await page.click('button:has-text("Welcome")', { timeout: 2000 });
    } catch {
      // If no button, navigate directly
      await page.goto('http://127.0.0.1:54341/staff-welcome.html');
    }
    
    await page.waitForTimeout(5000);
    
    // Step 4: Check if we stayed on the welcome page
    const finalUrl = page.url();
    console.log('\n5. Final URL:', finalUrl);
    
    if (finalUrl.includes('staff-welcome.html')) {
      console.log('✅ SUCCESS: Stayed on staff-welcome page!');
      
      // Check for user data
      const welcomeTitle = await page.locator('#welcome-title').textContent().catch(() => 'NOT FOUND');
      const nickname = await page.locator('#nickname').inputValue().catch(() => 'NOT FOUND');
      
      console.log('\n6. Page Data:');
      console.log('   Welcome title:', welcomeTitle);
      console.log('   Nickname field:', nickname);
      
      // Check session state
      const sessionState = await page.evaluate(async () => {
        if (typeof supabase === 'undefined') return { error: 'No supabase' };
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return { error: 'No session' };
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        return {
          userId: session.user.id,
          email: session.user.email,
          profile: profile
        };
      });
      
      console.log('\n7. Session State:');
      console.log(JSON.stringify(sessionState, null, 2));
      
    } else if (finalUrl.includes('home.html') || finalUrl.includes('index.html')) {
      console.log('❌ FAILED: User was redirected to login!');
    } else {
      console.log('⚠️ Unexpected URL:', finalUrl);
    }
    
    await page.screenshot({ path: 'test_welcome_fixed.png', fullPage: true });
    console.log('\n📸 Screenshot saved: test_welcome_fixed.png');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: 'test_welcome_error.png' });
  } finally {
    await browser.close();
  }
}

testWelcomeFix();