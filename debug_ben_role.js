import { chromium } from 'playwright';

async function debugBenRole() {
  console.log('🔍 Debugging ben.howard@stoke.nhs.uk role issue...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('1️⃣ Logging in as ben.howard@stoke.nhs.uk...');
    
    await page.goto('http://localhost:8001/Home.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    let currentUrl = page.url();
    console.log('🔗 Current URL after login:', currentUrl);
    
    // Add console log listener to capture JavaScript console output
    page.on('console', msg => {
      if (msg.text().includes('requireStaffSession') || msg.text().includes('role') || msg.text().includes('admin') || msg.text().includes('staff')) {
        console.log('🔍 Browser console:', msg.text());
      }
    });
    
    // Execute JavaScript to check the actual role data
    const roleData = await page.evaluate(async () => {
      // Import the needed functions
      const { initSupabase } = await import('./staff-common.js');
      const supabase = await initSupabase();
      
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          return { error: 'No session found' };
        }
        
        // Get profile data
        const { data: profileRow } = await supabase
          .from('master_users')
          .select('role, full_name, site_id, auth_auth_user_id')
          .eq('auth_user_id', session.user.id)
          .maybeSingle();
        
        return {
          userId: session.user.id,
          email: session.user.email,
          rawMetaRole: session.user?.raw_user_meta_data?.role,
          profileRole: profileRow?.role,
          profileData: profileRow,
          userMetaData: session.user?.raw_user_meta_data
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('\n📊 Role Data Analysis:');
    console.log('======================');
    console.log('User ID:', roleData.userId);
    console.log('Email:', roleData.email);
    console.log('Profile Role:', roleData.profileRole);
    console.log('Raw Meta Role:', roleData.rawMetaRole);
    console.log('Full Profile Data:', JSON.stringify(roleData.profileData, null, 2));
    console.log('User Meta Data:', JSON.stringify(roleData.userMetaData, null, 2));
    
    if (roleData.error) {
      console.log('❌ Error:', roleData.error);
    }
    
    // Check what requireStaffSession would return
    const staffSessionResult = await page.evaluate(async () => {
      const { initSupabase, requireStaffSession } = await import('./staff-common.js');
      const supabase = await initSupabase();
      
      try {
        const result = await requireStaffSession(supabase);
        return {
          success: true,
          sessionUserId: result.session.user.id,
          profileRole: result.profileRow?.role,
          profileFullName: result.profileRow?.full_name
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    });
    
    console.log('\n🔐 requireStaffSession Result:');
    console.log('==============================');
    console.log('Success:', staffSessionResult.success);
    if (staffSessionResult.success) {
      console.log('Session User ID:', staffSessionResult.sessionUserId);
      console.log('Profile Role:', staffSessionResult.profileRole);
      console.log('Profile Full Name:', staffSessionResult.profileFullName);
    } else {
      console.log('Error:', staffSessionResult.error);
    }
    
    // Try accessing index.html directly
    console.log('\n2️⃣ Testing access to index.html...');
    await page.goto('http://localhost:8001/index.html');
    await page.waitForTimeout(3000);
    
    currentUrl = page.url();
    console.log('🔗 URL after accessing index.html:', currentUrl);
    
    if (currentUrl.includes('index.html')) {
      console.log('✅ Successfully accessed index.html (should be admin)');
    } else {
      console.log('❌ Redirected away from index.html to:', currentUrl);
    }
    
    // Try accessing staff.html
    console.log('\n3️⃣ Testing access to staff.html...');
    await page.goto('http://localhost:8001/staff.html');
    await page.waitForTimeout(3000);
    
    currentUrl = page.url();
    console.log('🔗 URL after accessing staff.html:', currentUrl);
    
    if (currentUrl.includes('staff.html')) {
      console.log('✅ Successfully accessed staff.html');
    } else {
      console.log('❌ Redirected away from staff.html to:', currentUrl);
    }
    
    // Screenshot for reference
    await page.screenshot({ path: 'debug_ben_role.png' });
    console.log('\n📸 Screenshot saved: debug_ben_role.png');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    await page.screenshot({ path: 'debug_error.png' });
  } finally {
    await browser.close();
    console.log('\n🏁 Debug completed');
  }
}

debugBenRole();
