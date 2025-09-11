import { chromium } from 'playwright';

async function testCancelInvite() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing Cancel Invite functionality...');
  
  try {
    // Login as admin
    console.log('1. Opening admin page...');
    const adminPath = `file://${process.cwd()}/admin.html`;
    await page.goto(adminPath);
    await page.waitForTimeout(2000);
    
    // Check if already logged in, if not login
    const needsLogin = await page.locator('#email').isVisible().catch(() => false);
    if (needsLogin) {
      await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
      await page.locator('#password').fill('Hello1!');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
    }
    
    // Wait for admin dashboard to load
    await page.waitForSelector('#practice-users-tbody', { timeout: 10000 });
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'test_cancel_invite_1_initial.png', fullPage: true });
    console.log('Screenshot saved: test_cancel_invite_1_initial.png');
    
    // Look for any pending invitations with Cancel Invite button
    const cancelButtons = await page.locator('button:has-text("Cancel Invite")').all();
    
    if (cancelButtons.length === 0) {
      console.log('No pending invitations found. Creating a test invitation...');
      
      // Open invite modal
      await page.click('button:has-text("Invite User")');
      await page.waitForTimeout(1000);
      
      // Fill in test invite
      const testEmail = `test.user.${Date.now()}@example.com`;
      await page.locator('#invite-name').fill('Test User Cancel');
      await page.locator('#invite-email').fill(testEmail);
      await page.locator('#invite-access').selectOption('staff');
      
      // Submit invitation
      await page.click('button:has-text("Send Invitation")');
      await page.waitForTimeout(3000);
      
      // Close modal if still open
      const modalClose = await page.locator('#invite-modal-close').isVisible().catch(() => false);
      if (modalClose) {
        await page.click('#invite-modal-close');
      }
      
      // Wait for user list to refresh
      await page.waitForTimeout(2000);
      
      console.log(`Created test invitation for ${testEmail}`);
    }
    
    // Take screenshot before cancellation
    await page.screenshot({ path: 'test_cancel_invite_2_before_cancel.png', fullPage: true });
    console.log('Screenshot saved: test_cancel_invite_2_before_cancel.png');
    
    // Find the first Cancel Invite button again
    const cancelButton = await page.locator('button:has-text("Cancel Invite")').first();
    
    if (await cancelButton.isVisible()) {
      console.log('2. Found Cancel Invite button, clicking...');
      
      // Set up dialog handler for the confirmation
      page.once('dialog', async dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        await dialog.accept();
      });
      
      // Click cancel button
      await cancelButton.click();
      
      // Wait for the operation to complete
      await page.waitForTimeout(3000);
      
      // Look for success message
      const successMessage = await page.locator('.alert.success').textContent().catch(() => null);
      if (successMessage) {
        console.log(`✅ Success: ${successMessage}`);
      }
      
      // Take screenshot after cancellation
      await page.screenshot({ path: 'test_cancel_invite_3_after_cancel.png', fullPage: true });
      console.log('Screenshot saved: test_cancel_invite_3_after_cancel.png');
      
      console.log('✅ Cancel invite test completed successfully!');
    } else {
      console.log('⚠️ No Cancel Invite button found after creating test invitation');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test_cancel_invite_error.png', fullPage: true });
    console.log('Error screenshot saved: test_cancel_invite_error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testCancelInvite().catch(console.error);