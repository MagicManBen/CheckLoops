import { chromium } from 'playwright';

async function testFullInvitation() {
  console.log('🎯 Testing complete invitation flow for John Smith (benhowardmagic@hotmail.com)...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // STEP 1: Login as admin
    console.log('=== STEP 1: Admin Login ===');
    await page.goto('http://localhost:8000/Home.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    console.log('✅ Admin logged in, redirected to:', page.url());
    
    // Should be on staff.html, click Admin Site
    if (page.url().includes('staff.html')) {
      console.log('✅ Correctly redirected to staff.html');
      await page.click('a:has-text("Admin Site")');
      await page.waitForTimeout(3000);
      console.log('✅ Navigated to admin site');
    }
    
    // STEP 2: Go to Users section
    console.log('\n=== STEP 2: Navigate to Users Section ===');
    await page.click('button[data-section="users"]');
    await page.waitForTimeout(2000);
    
    // Take screenshot of users list
    await page.screenshot({ path: 'users_list_before.png' });
    console.log('📸 Screenshot: users_list_before.png');
    
    // STEP 3: Open invite modal
    console.log('\n=== STEP 3: Send Invitation ===');
    await page.click('#btn-invite-user');
    await page.waitForTimeout(1000);
    
    // Fill invitation form with NEW simplified fields
    await page.locator('#invite-name').fill('John Smith');
    await page.locator('#invite-email').fill('benhowardmagic@hotmail.com');
    
    // Select role (should be dropdown with owner/admin/staff)
    await page.locator('#invite-access').selectOption('staff');
    
    console.log('📝 Filled form:');
    console.log('   - Name: John Smith');
    console.log('   - Email: benhowardmagic@hotmail.com');
    console.log('   - Role: staff');
    
    // Take screenshot of modal
    await page.screenshot({ path: 'invite_modal_filled.png' });
    console.log('📸 Screenshot: invite_modal_filled.png');
    
    // Submit invitation
    await page.click('button[type="submit"]:has-text("Send Invitation")');
    await page.waitForTimeout(5000);
    
    // Check for success/error message
    const errorDiv = await page.locator('#invite-error');
    const isVisible = await errorDiv.isVisible();
    if (isVisible) {
      const message = await errorDiv.textContent();
      console.log('📨 Invitation result:', message);
      
      if (message.includes('successfully')) {
        console.log('✅ Invitation sent successfully');
      } else {
        console.log('❌ Invitation error:', message);
      }
    }
    
    // Wait for modal to close and refresh users list
    await page.waitForTimeout(3000);
    
    // STEP 4: Check database state after invitation
    console.log('\n=== STEP 4: Verify Database State ===');
    
    const dbState = await page.evaluate(async () => {
      const supabase = window.supabase;
      const email = 'benhowardmagic@hotmail.com';
      const results = {};
      
      // Check site_invites
      const { data: invites } = await supabase
        .from('site_invites')
        .select('*')
        .eq('email', email);
      results.site_invites = invites || [];
      
      // Check profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.eq.${email},full_name.eq.John Smith`);
      results.profiles = profiles || [];
      
      // Check kiosk_users
      const { data: kiosk } = await supabase
        .from('kiosk_users')
        .select('*')
        .eq('full_name', 'John Smith');
      results.kiosk_users = kiosk || [];
      
      return results;
    });
    
    console.log('\n📊 Database State After Invitation:');
    console.log('-------------------------------------');
    
    if (dbState.site_invites?.length > 0) {
      console.log('✅ site_invites:', dbState.site_invites.length, 'record(s)');
      const invite = dbState.site_invites[0];
      console.log('   - Status:', invite.status);
      console.log('   - Role:', invite.role);
      console.log('   - Full Name:', invite.full_name);
      console.log('   - Expires:', invite.expires_at);
    } else {
      console.log('❌ site_invites: No records');
    }
    
    if (dbState.profiles?.length > 0) {
      console.log('✅ profiles:', dbState.profiles.length, 'record(s)');
      console.log('   ⚠️ Profile exists before acceptance - this is unexpected');
    } else {
      console.log('✅ profiles: No records (expected - user hasn\'t accepted yet)');
    }
    
    if (dbState.kiosk_users?.length > 0) {
      console.log('⚠️ kiosk_users:', dbState.kiosk_users.length, 'record(s)');
      console.log('   ⚠️ kiosk_users should NOT exist until welcome is completed');
    } else {
      console.log('✅ kiosk_users: No records (expected - created during welcome)');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'users_list_after.png', fullPage: true });
    console.log('\n📸 Screenshot: users_list_after.png');
    
    console.log('\n=== ANALYSIS ===');
    console.log('Expected behavior:');
    console.log('1. ✅ Invitation creates site_invites record (status: pending)');
    console.log('2. ⏳ User receives email with invitation link');
    console.log('3. ⏳ When accepted: creates auth.users & profiles');
    console.log('4. ⏳ User directed to staff-welcome.html');
    console.log('5. ⏳ Completing welcome creates kiosk_users & staff_app_welcome');
    
    console.log('\n📍 Next Steps:');
    console.log('1. Check email for invitation link');
    console.log('2. Accept invitation to create account');
    console.log('3. Complete staff-welcome.html flow');
    console.log('4. Verify all tables are populated correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test_error.png' });
  } finally {
    await browser.close();
    console.log('\n🏁 Test completed');
  }
}

// Start server and run test
import { spawn } from 'child_process';

const server = spawn('python3', ['-m', 'http.server', '8000'], {
  cwd: process.cwd(),
  stdio: 'pipe'
});

await new Promise(resolve => setTimeout(resolve, 2000));

testFullInvitation().finally(() => {
  server.kill();
});