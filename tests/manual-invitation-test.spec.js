import { test, expect } from '@playwright/test';

test('Manual invitation test with logging', async ({ page }) => {
  // Enable console logging to capture all browser logs
  page.on('console', msg => {
    console.log(`🌐 BROWSER: ${msg.type()}: ${msg.text()}`);
  });

  // Capture JavaScript errors that might cause crashes
  page.on('pageerror', error => {
    console.log(`🚨 PAGE ERROR: ${error.message}`);
    console.log(`📍 Stack: ${error.stack}`);
  });

  // Capture unhandled exceptions
  page.on('crash', () => {
    console.log('💥 PAGE CRASHED!');
  });

  page.on('close', () => {
    console.log('🚪 PAGE CLOSED!');
  });

  // Capture network requests
  page.on('request', request => {
    if (request.url().includes('send-invitation') || request.url().includes('supabase')) {
      console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('send-invitation') || response.url().includes('supabase')) {
      console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
    }
  });

  console.log('🚀 Starting manual invitation test...');
  console.log('📍 Navigate to: http://127.0.0.1:5501/admin-login.html');

  // Step 1: Navigate to admin login page
  await page.goto('http://127.0.0.1:5501/admin-login.html');
  console.log('✅ Navigated to admin login page');


  console.log(`
🎯 MANUAL STEPS TO PERFORM:
1. Login with: benhowardmagic@hotmail.com / Hello1!
2. Scroll down to Settings (bottom dropdown)
3. Click Settings to expand
4. Click Users
5. Click "📧 Invite User"
6. Fill in form:
   - Full Name: Ben Howard Test
   - Email: ben.howard@stoke.nhs.uk
   - Access Level: Admin
   - Role/Team: Fill as needed
7. Click "📧 Send Invitation"

I'll monitor all logs and network activity...
Browser will stay open for 3 minutes for you to complete the steps.
  `);

  // Wait for 3 minutes to allow manual testing
  await page.waitForTimeout(3 * 60 * 1000);

  console.log('🏁 Manual test session ended. Check console logs above for any issues.');
  console.log('📧 Check Inbucket at: http://127.0.0.1:54324');
});