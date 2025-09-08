import { chromium } from 'playwright';

async function checkInvitation() {
  console.log('🔍 Checking invitation status for benhowardmagic@hotmail.com (John Smith)...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Login as admin
    console.log('🔑 Logging in as admin...');
    await page.goto('http://localhost:8000/Home.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    // Navigate to admin site
    await page.goto('http://localhost:8000/index.html');
    await page.waitForTimeout(3000);
    
    // Check tables directly
    const tableData = await page.evaluate(async () => {
      const results = {};
      const email = 'benhowardmagic@hotmail.com';
      
      try {
        const supabase = window.supabase;
        if (!supabase) return { error: 'Supabase client not found' };
        
        // 1. Check auth.users
        const { data: { user }, error: userError } = await supabase.auth.admin.getUser(email).catch(() => ({ data: { user: null }, error: 'Cannot access admin API' }));
        
        // 2. Check site_invites
        const { data: invites, error: invError } = await supabase
          .from('site_invites')
          .select('*')
          .eq('email', email);
        results.site_invites = { data: invites, error: invError };
        
        // 3. Check profiles
        const { data: profiles, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .or(`email.eq.${email},full_name.ilike.%John Smith%`);
        results.profiles = { data: profiles, error: profError };
        
        // 4. Check kiosk_users
        const { data: kiosk, error: kioskError } = await supabase
          .from('kiosk_users')
          .select('*')
          .or('full_name.eq.John Smith,full_name.ilike.%John%');
        results.kiosk_users = { data: kiosk, error: kioskError };
        
        // 5. Check staff_app_welcome
        const { data: saw, error: sawError } = await supabase
          .from('staff_app_welcome')
          .select('*')
          .or('full_name.eq.John Smith,full_name.ilike.%John%');
        results.staff_app_welcome = { data: saw, error: sawError };
        
        return results;
      } catch (err) {
        return { error: err.message };
      }
    });
    
    console.log('📊 Database Check Results:\n');
    console.log('=====================================\n');
    
    // Display results
    for (const [table, result] of Object.entries(tableData)) {
      console.log(`📋 ${table}:`);
      if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
      } else if (result.data && result.data.length > 0) {
        console.log(`   ✅ Found ${result.data.length} record(s)`);
        result.data.forEach((record, i) => {
          console.log(`   Record ${i + 1}:`, JSON.stringify(record, null, 2));
        });
      } else {
        console.log(`   ⚠️ No records found`);
      }
      console.log('');
    }
    
    console.log('=====================================\n');
    console.log('🎯 Analysis:');
    console.log('------------');
    
    // Analyze the flow
    if (tableData.site_invites?.data?.length > 0) {
      const invite = tableData.site_invites.data[0];
      console.log(`✅ Invitation found in site_invites`);
      console.log(`   - Status: ${invite.status}`);
      console.log(`   - Role: ${invite.role}`);
      console.log(`   - Name: ${invite.full_name}`);
      
      if (invite.status === 'pending') {
        console.log('   ⚠️ Invitation is still PENDING - user has not accepted yet');
      } else if (invite.status === 'accepted') {
        console.log('   ✅ Invitation ACCEPTED');
      }
    } else {
      console.log('❌ No invitation found in site_invites');
    }
    
    if (tableData.profiles?.data?.length > 0) {
      console.log('✅ User found in profiles table');
      const profile = tableData.profiles.data[0];
      console.log(`   - Role: ${profile.role}`);
      console.log(`   - Full Name: ${profile.full_name}`);
    } else {
      console.log('⚠️ User NOT in profiles table');
    }
    
    if (tableData.kiosk_users?.data?.length > 0) {
      console.log('✅ User found in kiosk_users table');
    } else {
      console.log('❌ User NOT in kiosk_users table');
      console.log('   ℹ️ kiosk_users should be created when user completes staff-welcome.html');
    }
    
    if (tableData.staff_app_welcome?.data?.length > 0) {
      console.log('✅ User found in staff_app_welcome table');
    } else {
      console.log('⚠️ User NOT in staff_app_welcome table');
      console.log('   ℹ️ This gets populated when user completes the welcome flow');
    }
    
    console.log('\n🔄 Expected Flow:');
    console.log('1. Admin invites user → creates site_invites record (status: pending)');
    console.log('2. User accepts invite → creates auth.users & profiles, updates site_invites (status: accepted)');
    console.log('3. User directed to staff-welcome.html');
    console.log('4. User completes welcome → creates staff_app_welcome & kiosk_users records');
    console.log('5. User can then access staff pages');
    
    console.log('\n📍 Current Status:');
    if (!tableData.site_invites?.data?.length) {
      console.log('❌ No invitation exists - need to send invitation first');
    } else if (tableData.site_invites?.data?.[0]?.status === 'pending') {
      console.log('⏳ Invitation sent but not accepted - user needs to check email');
    } else if (!tableData.kiosk_users?.data?.length) {
      console.log('⏳ User accepted but hasn\'t completed welcome flow');
      console.log('   → User should go to staff-welcome.html to complete setup');
    } else {
      console.log('✅ User fully set up');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await browser.close();
    console.log('\n🏁 Check completed');
  }
}

// Start server and run check
import { spawn } from 'child_process';

const server = spawn('python3', ['-m', 'http.server', '8000'], {
  cwd: process.cwd(),
  stdio: 'pipe'
});

await new Promise(resolve => setTimeout(resolve, 2000));

checkInvitation().finally(() => {
  server.kill();
});