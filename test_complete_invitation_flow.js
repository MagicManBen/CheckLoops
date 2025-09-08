import { chromium } from 'playwright';

async function testCompleteInvitationFlow() {
  console.log('Starting comprehensive invitation flow test...');
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for visibility
  });
  
  const context = await browser.newContext({
    recordVideo: {
      dir: './test-videos/',
      size: { width: 1280, height: 720 }
    }
  });
  
  const page = await context.newPage();
  
  try {
    // Step 1: Navigate to invitation link
    console.log('\n1. Navigating to invitation link...');
    const inviteUrl = 'https://unveoqnlqnobufhublyw.supabase.co/auth/v1/verify?token=a44a237511b4e3fe9564cc0fd4572de909638b36f143de0a60d444f9&type=invite&redirect_to=http://127.0.0.1:5500/simple-set-password.html';
    
    await page.goto(inviteUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Take screenshot of where we landed
    await page.screenshot({ path: 'test_1_after_invite_link.png', fullPage: true });
    console.log('Screenshot saved: test_1_after_invite_link.png');
    
    // Step 2: Should be on simple-set-password.html - set password
    const currentUrl = page.url();
    console.log(`\n2. Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('simple-set-password.html')) {
      console.log('✓ Correctly redirected to simple-set-password.html');
      
      // Fill in password fields
      console.log('Setting password to Hello1!...');
      await page.waitForSelector('#password', { timeout: 10000 });
      await page.fill('#password', 'Hello1!');
      await page.fill('#confirm-password', 'Hello1!');
      
      await page.screenshot({ path: 'test_2_password_form_filled.png' });
      console.log('Screenshot saved: test_2_password_form_filled.png');
      
      // Submit password form
      await page.click('button[type="submit"]');
      console.log('Password form submitted...');
      
      // Wait for redirect
      await page.waitForTimeout(5000);
      
      // Step 3: Verify redirect to staff-welcome.html (NOT index.html)
      const afterPasswordUrl = page.url();
      console.log(`\n3. After password creation, redirected to: ${afterPasswordUrl}`);
      
      await page.screenshot({ path: 'test_3_after_password_redirect.png', fullPage: true });
      console.log('Screenshot saved: test_3_after_password_redirect.png');
      
      if (afterPasswordUrl.includes('staff-welcome.html')) {
        console.log('✓ SUCCESS: Correctly redirected to staff-welcome.html');
      } else if (afterPasswordUrl.includes('index.html')) {
        console.log('✗ FAILURE: Incorrectly redirected to index.html - THIS IS THE BUG!');
        throw new Error('Wrong redirect after password creation');
      } else {
        console.log(`? Unexpected redirect to: ${afterPasswordUrl}`);
      }
      
      // Step 4: Complete welcome flow
      if (afterPasswordUrl.includes('staff-welcome.html')) {
        console.log('\n4. Completing welcome flow...');
        
        // Wait for form to load
        await page.waitForSelector('#fullNameInput', { timeout: 10000 });
        
        // Fill in welcome form
        console.log('Filling welcome form...');
        await page.fill('#fullNameInput', 'John Smith');
        await page.fill('#nicknameInput', 'Johnny');
        
        // Select role if dropdown exists
        const roleSelect = await page.$('#roleSelect');
        if (roleSelect) {
          await page.selectOption('#roleSelect', 'Staff');
          console.log('Selected Staff role');
        }
        
        await page.screenshot({ path: 'test_4_welcome_form_filled.png' });
        console.log('Screenshot saved: test_4_welcome_form_filled.png');
        
        // Submit welcome form
        const submitButton = await page.$('button:has-text("Save and Continue")') || 
                            await page.$('button:has-text("Complete Setup")') ||
                            await page.$('button[type="submit"]');
        
        if (submitButton) {
          await submitButton.click();
          console.log('Welcome form submitted...');
          await page.waitForTimeout(5000);
        }
        
        // Step 5: Should now be on staff.html
        const afterWelcomeUrl = page.url();
        console.log(`\n5. After welcome completion, redirected to: ${afterWelcomeUrl}`);
        
        await page.screenshot({ path: 'test_5_after_welcome_redirect.png', fullPage: true });
        console.log('Screenshot saved: test_5_after_welcome_redirect.png');
        
        if (afterWelcomeUrl.includes('staff.html')) {
          console.log('✓ Successfully redirected to staff.html');
          
          // Check that admin link is NOT visible for staff user
          const adminLink = await page.$('.admin-only');
          if (adminLink) {
            const isVisible = await adminLink.isVisible();
            if (!isVisible) {
              console.log('✓ Admin navigation correctly hidden for staff user');
            } else {
              console.log('✗ Admin navigation incorrectly visible for staff user');
            }
          }
        }
        
        // Step 6: Test that staff cannot access index.html
        console.log('\n6. Testing staff role guard on index.html...');
        await page.goto('http://127.0.0.1:58156/index.html');
        await page.waitForTimeout(3000);
        
        const indexTestUrl = page.url();
        console.log(`After trying to access index.html: ${indexTestUrl}`);
        
        await page.screenshot({ path: 'test_6_index_access_attempt.png', fullPage: true });
        console.log('Screenshot saved: test_6_index_access_attempt.png');
        
        if (!indexTestUrl.includes('index.html')) {
          console.log('✓ Staff user correctly blocked from index.html');
        } else {
          console.log('✗ SECURITY ISSUE: Staff user accessed index.html!');
        }
      }
      
    } else if (currentUrl.includes('set-password.html')) {
      console.log('Redirected to set-password.html instead of simple-set-password.html');
      // Handle the alternative password page
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      await page.fill('input[type="password"]:first-of-type', 'Hello1!');
      await page.fill('input[type="password"]:last-of-type', 'Hello1!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
    } else {
      console.log(`Unexpected redirect URL: ${currentUrl}`);
    }
    
    // Final summary
    console.log('\n========== TEST SUMMARY ==========');
    console.log('Test completed. Check screenshots for visual verification.');
    console.log('Key points to verify:');
    console.log('1. Password creation redirects to staff-welcome.html (NOT index.html)');
    console.log('2. Welcome flow completes successfully');
    console.log('3. Staff user redirects to staff.html after welcome');
    console.log('4. Staff user cannot access index.html');
    console.log('5. Admin navigation is hidden for staff users');
    console.log('===================================\n');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test_error.png', fullPage: true });
    console.log('Error screenshot saved: test_error.png');
  } finally {
    await context.close();
    await browser.close();
  }
}

// Run the test
testCompleteInvitationFlow().catch(console.error);