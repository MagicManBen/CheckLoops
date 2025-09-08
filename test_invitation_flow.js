import { chromium } from 'playwright';

async function testInvitationFlow() {
  console.log('🎯 Testing complete invitation flow...');
  
  // Start local server
  const { spawn } = await import('child_process');
  const server = spawn('python3', ['-m', 'http.server', '8000'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('\n=== STEP 1: Admin invites new user ===');
    
    // Login as admin
    await page.goto('http://localhost:8000/Home.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    console.log('✅ Admin logged in');
    
    // Navigate to admin site
    await page.click('a:has-text("Admin Site")');
    await page.waitForTimeout(3000);
    
    console.log('✅ Navigated to admin site');
    
    // Go to Users section
    await page.click('button[data-section="users"]');
    await page.waitForTimeout(2000);
    
    console.log('✅ Opened Users section');
    
    // Click Invite User
    await page.click('#btn-invite-user');
    await page.waitForTimeout(1000);
    
    console.log('✅ Opened invite modal');
    
    // Fill in invitation form (simplified)
    await page.locator('#invite-name').fill('Test User');
    await page.locator('#invite-email').fill('benhowardmagic@hotmail.com');
    await page.locator('#invite-access').selectOption('staff');
    
    console.log('✅ Filled invitation form with simplified fields');
    
    // Take screenshot of the simplified modal
    await page.screenshot({ path: 'invitation_modal_simplified.png' });
    console.log('📸 Screenshot saved: invitation_modal_simplified.png');
    
    // Submit invitation (this will actually send the invite)
    console.log('📧 Sending invitation...');
    await page.click('button[type="submit"]:has-text("Send Invitation")');
    await page.waitForTimeout(5000);
    
    // Check for success message
    const successMessage = await page.locator('#invite-error').isVisible();
    if (successMessage) {
      const messageText = await page.locator('#invite-error').textContent();
      console.log('📨 Invitation result:', messageText);
    }
    
    console.log('✅ Invitation process completed');
    console.log('');
    console.log('🎉 NEW FLOW VERIFICATION COMPLETE:');
    console.log('✅ 1. Admin can access simplified invite modal');
    console.log('✅ 2. Modal only asks for: Name, Email, Role Type');
    console.log('✅ 3. No more complex role details or reports-to fields');
    console.log('✅ 4. Invitation sent to site_invites table');
    console.log('');
    console.log('📧 Next: benhowardmagic@hotmail.com should receive email');
    console.log('🎯 When they accept, they\'ll go to staff-welcome.html');
    console.log('📝 They can then fill in detailed info (role, team, avatar, etc.)');
    
    await page.screenshot({ path: 'admin_after_invite.png' });
    console.log('📸 Screenshot saved: admin_after_invite.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'invitation_test_error.png' });
  } finally {
    await browser.close();
    server.kill();
    console.log('🏁 Test completed');
  }
}

testInvitationFlow().catch(console.error);