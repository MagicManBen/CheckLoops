import { chromium } from 'playwright';

async function testManualAcceptance() {
  console.log('🎯 Testing manual invitation acceptance flow...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('1️⃣ First, let\'s fix the invitation status to pending...');
    
    // Login as admin to fix the status
    await page.goto('http://localhost:8000/Home.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    await page.goto('http://localhost:8000/index.html');
    await page.waitForTimeout(3000);
    
    // Fix the invitation status
    const fixResult = await page.evaluate(async () => {
      const supabase = window.supabase;
      
      // Update to pending
      const { data, error } = await supabase
        .from('site_invites')
        .update({ status: 'pending' })
        .eq('email', 'benhowardmagic@hotmail.com')
        .eq('full_name', 'John Smith')
        .select();
      
      return { data, error };
    });
    
    if (fixResult.error) {
      console.log('❌ Failed to fix status:', fixResult.error);
    } else {
      console.log('✅ Invitation status reset to pending');
    }
    
    // Logout admin
    await page.goto('http://localhost:8000/Home.html');
    await page.waitForTimeout(2000);
    
    console.log('\n2️⃣ Now testing user signup/login flow...');
    
    // Try to login as the invited user (they don't have an account yet)
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    
    // Take screenshot
    await page.screenshot({ path: 'login_attempt.png' });
    console.log('📸 Screenshot: login_attempt.png');
    
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Check for error or redirect
    const currentUrl = page.url();
    console.log('📍 Current URL after login attempt:', currentUrl);
    
    // Check for error message
    const errorElement = await page.locator('#auth-error');
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.log('⚠️ Login error:', errorText);
      console.log('   → This is expected - user doesn\'t have an account yet');
    }
    
    console.log('\n3️⃣ The correct flow should be:');
    console.log('   a) User receives invitation email with a special link');
    console.log('   b) Link contains an invitation token');
    console.log('   c) They set their password on first visit');
    console.log('   d) Account is created and invitation marked as accepted');
    console.log('   e) User is redirected to staff-welcome.html');
    
    console.log('\n4️⃣ Since Edge Function is failing, let\'s simulate acceptance...');
    
    // Back to admin to manually create the user
    await page.goto('http://localhost:8000/Home.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    await page.goto('http://localhost:8000/index.html');
    await page.waitForTimeout(3000);
    
    // Create user account manually
    const createResult = await page.evaluate(async () => {
      const supabase = window.supabase;
      
      // Note: We can't create auth users from the client
      // This would need to be done through the dashboard or a server function
      
      return { 
        message: 'Cannot create auth user from client - needs dashboard or server access',
        suggestion: 'Use Supabase dashboard to manually create user with email benhowardmagic@hotmail.com'
      };
    });
    
    console.log('\n📝 Result:', createResult.message);
    console.log('💡 Suggestion:', createResult.suggestion);
    
    console.log('\n5️⃣ MANUAL STEPS NEEDED:');
    console.log('   1. Go to Supabase Dashboard → Authentication → Users');
    console.log('   2. Click "Invite User"');
    console.log('   3. Enter email: benhowardmagic@hotmail.com');
    console.log('   4. User will receive email to set password');
    console.log('   5. After setting password, they\'ll be redirected to staff-welcome.html');
    console.log('   6. Completing welcome creates kiosk_users entry');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test_error.png' });
  } finally {
    await browser.close();
    console.log('\n🏁 Test completed');
  }
}

// Start server and run
import { spawn } from 'child_process';
const server = spawn('python3', ['-m', 'http.server', '8000'], {
  cwd: process.cwd(),
  stdio: 'pipe'
});

await new Promise(resolve => setTimeout(resolve, 2000));
testManualAcceptance().finally(() => server.kill());