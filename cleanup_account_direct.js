import { chromium } from 'playwright';

async function cleanupDirectly() {
  console.log('🧹 Starting direct cleanup of benhowardmagic@hotmail.com...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // First, login as admin (ben.howard@stoke.nhs.uk) who has permissions
    console.log('🔑 Logging in as admin...');
    await page.goto('http://localhost:8000/Home.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    console.log('✅ Admin logged in');
    
    // Navigate to a page where we can run JavaScript
    await page.goto('http://localhost:8000/index.html');
    await page.waitForTimeout(3000);
    
    // Run cleanup directly in the browser context
    console.log('🗑️ Running cleanup commands...');
    
    const cleanupResult = await page.evaluate(async () => {
      const results = [];
      const email = 'benhowardmagic@hotmail.com';
      const userId = 'f3cc7af8-273f-4602-99a1-a87214ca89e1';
      
      try {
        // Get supabase client from the page
        const supabase = window.supabase;
        if (!supabase) {
          return { error: 'Supabase client not found on page' };
        }
        
        // 1. Clean site_invites
        console.log('Cleaning site_invites...');
        const { data: invites, error: invError } = await supabase
          .from('site_invites')
          .delete()
          .eq('email', email)
          .select();
        results.push({ table: 'site_invites', deleted: invites?.length || 0, error: invError });
        
        // 2. Clean profiles
        console.log('Cleaning profiles...');
        const { data: profiles, error: profError } = await supabase
          .from('master_users')
          .delete()
          .eq('auth_user_id', userId)
          .select();
        results.push({ table: 'profiles', deleted: profiles?.length || 0, error: profError });
        
        // 3. Clean staff_app_welcome
        console.log('Cleaning staff_app_welcome...');
        const { data: saw, error: sawError } = await supabase
          .from('master_users')
          .delete()
          .eq('auth_user_id', userId)
          .select();
        results.push({ table: 'staff_app_welcome', deleted: saw?.length || 0, error: sawError });
        
        // 4. Clean kiosk_users by full_name
        console.log('Cleaning kiosk_users...');
        const names = ['new name', 'benhowardmagic', 'Ben Howard Magic', 'Test User'];
        for (const name of names) {
          const { data: kiosk, error: kioskError } = await supabase
            .from('master_users')
            .delete()
            .eq('full_name', name)
            .select();
          if (kiosk && kiosk.length > 0) {
            results.push({ table: 'kiosk_users', deleted: kiosk.length, name, error: kioskError });
          }
        }
        
        // 5. Clean user_permissions
        console.log('Cleaning user_permissions...');
        const { data: perms, error: permError } = await supabase
          .from('master_users')
          .delete()
          .eq('auth_user_id', userId)
          .select();
        results.push({ table: 'user_permissions', deleted: perms?.length || 0, error: permError });
        
        // Note: We can't delete from auth.users directly from client
        results.push({ 
          note: 'auth.users deletion requires admin dashboard access',
          userId: userId,
          email: email
        });
        
        return { success: true, results };
        
      } catch (err) {
        return { error: err.message, results };
      }
    });
    
    console.log('📊 Cleanup Results:');
    console.log(JSON.stringify(cleanupResult, null, 2));
    
    if (cleanupResult.success) {
      console.log('✅ Successfully cleaned up database tables');
      console.log('');
      console.log('⚠️  IMPORTANT: You still need to manually delete the auth user:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to Authentication → Users');
      console.log('3. Find benhowardmagic@hotmail.com');
      console.log('4. Delete the user');
      console.log('');
      console.log('User ID to delete: f3cc7af8-273f-4602-99a1-a87214ca89e1');
    }
    
    // Take a screenshot of the current state
    await page.screenshot({ path: 'cleanup_complete.png' });
    console.log('📸 Screenshot saved: cleanup_complete.png');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    await page.screenshot({ path: 'cleanup_error.png' });
  } finally {
    await browser.close();
    console.log('🏁 Cleanup process completed');
  }
}

// Start local server and run cleanup
import { spawn } from 'child_process';

const server = spawn('python3', ['-m', 'http.server', '8000'], {
  cwd: process.cwd(),
  stdio: 'pipe'
});

// Wait for server to start
await new Promise(resolve => setTimeout(resolve, 2000));

cleanupDirectly().finally(() => {
  server.kill();
});