import { chromium } from 'playwright';

async function verifyBenRole() {
  console.log('🔍 Verifying benhowardmagic@hotmail.com role display...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('1️⃣ Logging in as benhowardmagic@hotmail.com...');
    
    await page.goto('http://localhost:8001/Home.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    let currentUrl = page.url();
    console.log('🔗 Current URL after login:', currentUrl);
    
    // Check role display in staff.html
    console.log('\n2️⃣ Testing staff.html role display...');
    await page.goto('http://localhost:8001/staff.html');
    await page.waitForTimeout(3000);
    
    // Check the role pill text
    const rolePill = await page.locator('#role-pill').textContent();
    console.log('Role displayed in pill:', rolePill);
    
    if (rolePill.toLowerCase().includes('admin')) {
      console.log('✅ SUCCESS: Role correctly shows as Admin');
    } else {
      console.log('❌ FAILURE: Role still not showing as Admin');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'verify_ben_role.png' });
    console.log('📸 Screenshot saved: verify_ben_role.png');
    
    // Check role data in browser console
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
    
    console.log('\n📊 Role Data from Browser:');
    console.log('======================');
    console.log('User ID:', roleData.userId);
    console.log('Email:', roleData.email);
    console.log('Profile Role:', roleData.profileRole);
    console.log('Raw Meta Role:', roleData.rawMetaRole);
    console.log('Full Profile Data:', JSON.stringify(roleData.profileData, null, 2));
    console.log('User Meta Data:', JSON.stringify(roleData.userMetaData, null, 2));
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    await page.screenshot({ path: 'verify_error.png' });
  } finally {
    await browser.close();
    console.log('\n🏁 Verification completed');
  }
}

verifyBenRole();
