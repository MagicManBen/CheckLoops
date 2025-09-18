import { chromium } from 'playwright';

async function checkUserState() {
  console.log('🔍 Checking complete state for John Smith (benhowardmagic@hotmail.com)...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Login as admin to check
    await page.goto('http://localhost:8000/Home.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    await page.goto('http://localhost:8000/index.html');
    await page.waitForTimeout(3000);
    
    // Check all tables
    const fullState = await page.evaluate(async () => {
      const supabase = window.supabase;
      const email = 'benhowardmagic@hotmail.com';
      
      const results = {
        timestamp: new Date().toISOString(),
        tables: {}
      };
      
      // 1. site_invites
      const { data: invites } = await supabase
        .from('site_invites')
        .select('*')
        .eq('email', email);
      results.tables.site_invites = invites || [];
      
      // 2. profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.eq.${email},full_name.eq.John Smith`);
      results.tables.profiles = profiles || [];
      
      // 3. kiosk_users
      const { data: kiosk } = await supabase
        .from('kiosk_users')
        .select('*')
        .or('full_name.eq.John Smith,full_name.ilike.%John%');
      results.tables.kiosk_users = kiosk || [];
      
      // 4. staff_app_welcome
      const { data: saw } = await supabase
        .from('staff_app_welcome')
        .select('*')
        .or('full_name.eq.John Smith,full_name.ilike.%John%');
      results.tables.staff_app_welcome = saw || [];
      
      // 5. Check if user can login
      const { data: session } = await supabase.auth.getSession();
      results.currentSession = session ? 'Active' : 'None';
      
      return results;
    });
    
    console.log('📊 Complete Database State:\n');
    console.log('=====================================\n');
    
    // site_invites
    console.log('📋 SITE_INVITES:');
    if (fullState.tables.site_invites?.length > 0) {
      fullState.tables.site_invites.forEach(invite => {
        console.log(`   ✅ Found invitation`);
        console.log(`      - Status: ${invite.status}`);
        console.log(`      - Role: ${invite.role}`);
        console.log(`      - Name: ${invite.full_name}`);
        console.log(`      - Created: ${invite.created_at}`);
        console.log(`      - Expires: ${invite.expires_at}`);
      });
    } else {
      console.log('   ❌ No records');
    }
    
    // profiles
    console.log('\n📋 PROFILES:');
    if (fullState.tables.profiles?.length > 0) {
      fullState.tables.profiles.forEach(profile => {
        console.log(`   ✅ Found profile`);
        console.log(`      - User ID: ${profile.user_id}`);
        console.log(`      - Name: ${profile.full_name}`);
        console.log(`      - Role: ${profile.role}`);
        console.log(`      - Site ID: ${profile.site_id}`);
      });
    } else {
      console.log('   ❌ No records');
    }
    
    // kiosk_users
    console.log('\n📋 KIOSK_USERS:');
    if (fullState.tables.kiosk_users?.length > 0) {
      fullState.tables.kiosk_users.forEach(ku => {
        console.log(`   ✅ Found kiosk user`);
        console.log(`      - ID: ${ku.id}`);
        console.log(`      - Name: ${ku.full_name}`);
        console.log(`      - Role: ${ku.role}`);
        console.log(`      - Active: ${ku.active}`);
      });
    } else {
      console.log('   ❌ No records (will be created during welcome)');
    }
    
    // staff_app_welcome
    console.log('\n📋 STAFF_APP_WELCOME:');
    if (fullState.tables.staff_app_welcome?.length > 0) {
      fullState.tables.staff_app_welcome.forEach(saw => {
        console.log(`   ✅ Found welcome record`);
        console.log(`      - Name: ${saw.full_name}`);
        console.log(`      - Nickname: ${saw.nickname}`);
        console.log(`      - Role: ${saw.role_detail}`);
      });
    } else {
      console.log('   ❌ No records (will be created during welcome)');
    }
    
    console.log('\n=====================================\n');
    console.log('🎯 ANALYSIS:\n');
    
    const hasInvite = fullState.tables.site_invites?.length > 0;
    const inviteStatus = fullState.tables.site_invites?.[0]?.status;
    const hasProfile = fullState.tables.profiles?.length > 0;
    const hasKioskUser = fullState.tables.kiosk_users?.length > 0;
    const hasWelcome = fullState.tables.staff_app_welcome?.length > 0;
    
    if (!hasInvite) {
      console.log('❌ No invitation exists');
      console.log('   → Need to send invitation first');
    } else if (inviteStatus === 'pending') {
      console.log('⏳ Invitation sent but not accepted');
      console.log('   → User needs to check email and click link');
    } else if (inviteStatus === 'accepted' && !hasProfile) {
      console.log('⚠️ Invitation marked accepted but no profile');
      console.log('   → Something went wrong during acceptance');
    } else if (hasProfile && !hasWelcome) {
      console.log('✅ User accepted invitation');
      console.log('⏳ User has not completed welcome flow');
      console.log('   → User should login and go to staff-welcome.html');
    } else if (hasWelcome && !hasKioskUser) {
      console.log('⚠️ Welcome completed but no kiosk_users entry');
      console.log('   → Sync issue between staff_app_welcome and kiosk_users');
    } else if (hasWelcome && hasKioskUser) {
      console.log('✅ User fully set up and ready to use the system');
    }
    
    console.log('\n📝 NEXT STEPS:');
    if (inviteStatus === 'accepted' && hasProfile) {
      console.log('1. User should login with their credentials');
      console.log('2. They will be redirected to staff-welcome.html');
      console.log('3. Complete the welcome flow (nickname, role, team, avatar)');
      console.log('4. This will create kiosk_users and staff_app_welcome entries');
      console.log('5. Then they can access the staff pages');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await browser.close();
    console.log('\n🏁 Check completed');
  }
}

// Start server and run
import { spawn } from 'child_process';
const server = spawn('python3', ['-m', 'http.server', '8000'], {
  cwd: process.cwd(),
  stdio: 'pipe'
});

await new Promise(resolve => setTimeout(resolve, 2000));
checkUserState().finally(() => server.kill());