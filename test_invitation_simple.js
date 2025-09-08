import { chromium } from 'playwright';

async function testInvitationSimple() {
  console.log('🎯 Simple test of invitation flow...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Login as admin
    console.log('1️⃣ Logging in as admin...');
    await page.goto('http://localhost:8000/Home.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    // Navigate to admin site
    console.log('2️⃣ Navigating to admin site...');
    if (page.url().includes('staff.html')) {
      await page.click('a:has-text("Admin Site")');
      await page.waitForTimeout(5000);
    }
    
    // Wait for page to fully load
    console.log('3️⃣ Waiting for page to load...');
    await page.waitForSelector('#sidebar', { state: 'visible' });
    
    // Try to expand Settings if needed
    const settingsToggle = await page.locator('.nav-group-toggle:has-text("Settings")');
    if (await settingsToggle.isVisible()) {
      console.log('   Expanding Settings menu...');
      await settingsToggle.click();
      await page.waitForTimeout(1000);
    }
    
    // Click Users button
    console.log('4️⃣ Opening Users section...');
    const usersBtn = await page.locator('button:has-text("Users")').first();
    await usersBtn.click();
    await page.waitForTimeout(2000);
    
    // Click Invite User
    console.log('5️⃣ Opening invite modal...');
    await page.click('#btn-invite-user');
    await page.waitForTimeout(1000);
    
    // Fill form
    console.log('6️⃣ Filling invitation form...');
    await page.locator('#invite-name').fill('John Smith');
    await page.locator('#invite-email').fill('benhowardmagic@hotmail.com');
    await page.locator('#invite-access').selectOption('staff');
    
    // Take screenshot
    await page.screenshot({ path: 'invite_form.png' });
    console.log('📸 Screenshot: invite_form.png');
    
    // Submit
    console.log('7️⃣ Sending invitation...');
    await page.click('button[type="submit"]:has-text("Send Invitation")');
    await page.waitForTimeout(5000);
    
    // Check result
    const errorDiv = await page.locator('#invite-error');
    if (await errorDiv.isVisible()) {
      const message = await errorDiv.textContent();
      console.log('📨 Result:', message);
    }
    
    // Check database
    console.log('\n8️⃣ Checking database...');
    const dbCheck = await page.evaluate(async () => {
      const supabase = window.supabase;
      const { data: invites } = await supabase
        .from('site_invites')
        .select('*')
        .eq('email', 'benhowardmagic@hotmail.com')
        .order('created_at', { ascending: false })
        .limit(1);
      return invites?.[0] || null;
    });
    
    if (dbCheck) {
      console.log('✅ Invitation found in site_invites:');
      console.log('   - Status:', dbCheck.status);
      console.log('   - Role:', dbCheck.role);
      console.log('   - Name:', dbCheck.full_name);
      console.log('   - Site ID:', dbCheck.site_id);
    } else {
      console.log('❌ No invitation found in site_invites');
    }
    
    console.log('\n✅ Test completed successfully!');
    console.log('\n📝 Summary:');
    console.log('- Invitation should be in site_invites table');
    console.log('- User needs to check email and accept invitation');
    console.log('- After acceptance, they go to staff-welcome.html');
    console.log('- Completing welcome creates kiosk_users entry');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'error.png' });
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
testInvitationSimple().finally(() => server.kill());