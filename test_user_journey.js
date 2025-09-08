import { chromium } from 'playwright';

async function testUserJourney() {
  console.log('🎯 Testing complete user journey for benhowardmagic@hotmail.com...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('1️⃣ Attempting to login as invited user...');
    await page.goto('http://localhost:8000/Home.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    const urlAfterLogin = page.url();
    console.log('📍 URL after login:', urlAfterLogin);
    
    if (urlAfterLogin.includes('staff.html')) {
      console.log('✅ User successfully logged in and redirected to staff.html');
      console.log('   → This means auth.users account exists');
      
      // Check if they should be on staff-welcome instead
      console.log('\n2️⃣ Checking if user has completed welcome flow...');
      
      // Navigate to staff-welcome.html to check if they need to complete it
      await page.goto('http://localhost:8000/staff-welcome.html');
      await page.waitForTimeout(3000);
      
      // Check what's visible on the welcome page
      const step1Visible = await page.locator('#welcome-step1').isVisible();
      const step2Visible = await page.locator('#welcome-step2').isVisible();
      const step3Visible = await page.locator('#welcome-step3').isVisible();
      
      if (step1Visible || step2Visible || step3Visible) {
        console.log('✅ User is on staff-welcome.html and needs to complete setup');
        
        // Take screenshot
        await page.screenshot({ path: 'staff_welcome_state.png', fullPage: true });
        console.log('📸 Screenshot: staff_welcome_state.png');
        
        // Try to complete the welcome flow
        console.log('\n3️⃣ Completing welcome flow...');
        
        // Step 1: Nickname (if visible)
        if (step1Visible) {
          console.log('   Step 1: Setting nickname...');
          await page.locator('#nickname').fill('Johnny');
          await page.click('#next-step1');
          await page.waitForTimeout(2000);
        }
        
        // Step 2: Role and Team
        const step2NowVisible = await page.locator('#welcome-step2').isVisible();
        if (step2NowVisible) {
          console.log('   Step 2: Setting role and team...');
          
          // Select a role
          const roleOptions = await page.locator('input[name="role"]');
          const roleCount = await roleOptions.count();
          if (roleCount > 0) {
            await roleOptions.first().click();
            console.log('   - Selected first available role');
          }
          
          // Click next
          const toAvatarBtn = await page.locator('#to-avatar-btn');
          if (await toAvatarBtn.isVisible()) {
            await toAvatarBtn.click();
            await page.waitForTimeout(2000);
          }
        }
        
        // Step 3: Avatar
        const step3NowVisible = await page.locator('#welcome-step3').isVisible();
        if (step3NowVisible) {
          console.log('   Step 3: Setting avatar...');
          
          // Just save the default avatar
          const saveAvatarBtn = await page.locator('#save-avatar-btn');
          if (await saveAvatarBtn.isVisible()) {
            await saveAvatarBtn.click();
            await page.waitForTimeout(3000);
            console.log('   - Saved default avatar');
          }
          
          // Finish setup
          const finishBtn = await page.locator('#finish-avatar-btn');
          if (await finishBtn.isVisible()) {
            await finishBtn.click();
            console.log('   - Clicked finish');
            await page.waitForTimeout(5000);
          }
        }
        
        // Check where we ended up
        const finalUrl = page.url();
        console.log('\n📍 Final URL after welcome:', finalUrl);
        
        if (finalUrl.includes('staff.html')) {
          console.log('✅ Successfully completed welcome and redirected to staff.html');
        }
      } else {
        console.log('⚠️ Welcome flow might already be completed or not accessible');
      }
      
      // Check database state
      console.log('\n4️⃣ Checking final database state...');
      
      await page.goto('http://localhost:8000/index.html');
      await page.waitForTimeout(3000);
      
      const dbState = await page.evaluate(async () => {
        const supabase = window.supabase;
        const email = 'benhowardmagic@hotmail.com';
        
        const results = {};
        
        // Get user ID from session
        const { data: { user } } = await supabase.auth.getUser();
        results.userId = user?.id || null;
        results.userEmail = user?.email || null;
        
        // Check tables
        if (user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          results.profile = profile;
          
          const { data: saw } = await supabase
            .from('staff_app_welcome')
            .select('*')
            .eq('user_id', user.id)
            .single();
          results.staff_app_welcome = saw;
        }
        
        const { data: kiosk } = await supabase
          .from('kiosk_users')
          .select('*')
          .or('full_name.eq.John Smith,full_name.eq.Johnny')
          .single();
        results.kiosk_user = kiosk;
        
        return results;
      });
      
      console.log('\n📊 Final Database State:');
      console.log('-------------------------------------');
      
      if (dbState.userId) {
        console.log('✅ Auth User:', dbState.userEmail);
        console.log('   User ID:', dbState.userId);
      }
      
      if (dbState.profile) {
        console.log('✅ Profile exists');
        console.log('   - Name:', dbState.profile.full_name);
        console.log('   - Role:', dbState.profile.role);
      } else {
        console.log('❌ No profile record');
      }
      
      if (dbState.staff_app_welcome) {
        console.log('✅ Staff App Welcome exists');
        console.log('   - Nickname:', dbState.staff_app_welcome.nickname);
        console.log('   - Role:', dbState.staff_app_welcome.role_detail);
      } else {
        console.log('❌ No staff_app_welcome record');
      }
      
      if (dbState.kiosk_user) {
        console.log('✅ Kiosk User exists');
        console.log('   - Name:', dbState.kiosk_user.full_name);
        console.log('   - Active:', dbState.kiosk_user.active);
      } else {
        console.log('❌ No kiosk_user record');
      }
      
    } else if (urlAfterLogin.includes('Home.html')) {
      console.log('❌ Login failed - user might not have an account');
      
      const errorElement = await page.locator('#auth-error');
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log('   Error:', errorText);
      }
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'journey_error.png' });
  } finally {
    await browser.close();
  }
}

// Start server and run
import { spawn } from 'child_process';
const server = spawn('python3', ['-m', 'http.server', '8000'], {
  cwd: process.cwd(),
  stdio: 'pipe'
});

await new Promise(resolve => setTimeout(resolve, 2000));
testUserJourney().finally(() => server.kill());