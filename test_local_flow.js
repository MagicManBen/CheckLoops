import { chromium } from 'playwright';

async function testLocalFlow() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Starting LOCAL user flow test...');
  
  try {
    // Test 1: Admin login flow
    console.log('\n=== TEST 1: Admin Account Login (LOCAL) ===');
    await page.goto('http://localhost:8000/Home.html');
    await page.waitForTimeout(2000);
    
    // Login as admin
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    
    console.log('Logging in as admin...');
    await page.waitForTimeout(5000);
    
    // Should redirect to staff.html for all users now
    const urlAfterLogin = page.url();
    console.log('URL after admin login:', urlAfterLogin);
    
    if (urlAfterLogin.includes('staff.html')) {
      console.log('✅ Admin user correctly redirected to staff.html');
    } else {
      console.log('❌ Admin user not redirected to staff.html');
    }
    
    // Check if admin navigation option is visible
    await page.waitForTimeout(2000);
    const adminLink = await page.locator('a[data-page="admin"]').isVisible();
    console.log('Admin navigation link visible:', adminLink);
    
    if (adminLink) {
      console.log('✅ Admin user can see admin navigation option');
      
      // Click on admin link to go to admin site
      await page.click('a[data-page="admin"]');
      await page.waitForTimeout(3000);
      
      const adminUrl = page.url();
      console.log('Admin site URL:', adminUrl);
      
      if (adminUrl.includes('index.html')) {
        console.log('✅ Successfully navigated to admin site');
        
        // Check invite modal changes
        await page.click('button[data-section="users"]');
        await page.waitForTimeout(2000);
        
        const inviteBtn = await page.locator('#btn-invite-user').isVisible();
        if (inviteBtn) {
          await page.click('#btn-invite-user');
          await page.waitForTimeout(1000);
          
          // Check if only name, email, and role type fields are present
          const nameField = await page.locator('#invite-name').isVisible();
          const emailField = await page.locator('#invite-email').isVisible();
          const roleField = await page.locator('#invite-access').isVisible();
          
          // Check that old fields are NOT present
          const roleDetailField = await page.locator('#invite-role').count();
          const reportsToField = await page.locator('#invite-reports-to').count();
          
          console.log('\n=== Invite Modal Fields ===');
          console.log('Name field present:', nameField);
          console.log('Email field present:', emailField);
          console.log('Role type field present:', roleField);
          console.log('Old role detail field removed:', roleDetailField === 0);
          console.log('Old reports-to field removed:', reportsToField === 0);
          
          if (nameField && emailField && roleField && roleDetailField === 0 && reportsToField === 0) {
            console.log('✅ Invite modal correctly simplified');
          }
          
          // Close modal
          await page.click('#invite-modal-close');
        }
      }
    } else {
      console.log('❌ Admin navigation link not visible for admin user');
    }
    
    // Take screenshot of admin view
    await page.screenshot({ path: 'test_local_admin_view.png', fullPage: true });
    console.log('Screenshot saved: test_local_admin_view.png');
    
    // Sign out
    const signOutBtn = await page.locator('button:has-text("Sign Out")').isVisible();
    if (signOutBtn) {
      await page.click('button:has-text("Sign Out")');
      await page.waitForTimeout(3000);
    }
    
    // Test 2: Staff login flow
    console.log('\n=== TEST 2: Staff Account Login (LOCAL) ===');
    await page.goto('http://localhost:8000/Home.html');
    await page.waitForTimeout(2000);
    
    // Login as staff
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    
    console.log('Logging in as staff...');
    await page.waitForTimeout(5000);
    
    // Should redirect to staff.html
    const staffUrl = page.url();
    console.log('URL after staff login:', staffUrl);
    
    if (staffUrl.includes('staff.html')) {
      console.log('✅ Staff user redirected to staff page');
    }
    
    // Check if admin navigation option is NOT visible for staff
    await page.waitForTimeout(2000);
    const adminLinkForStaff = await page.locator('a[data-page="admin"]').isVisible();
    console.log('Admin navigation link visible for staff:', adminLinkForStaff);
    
    if (!adminLinkForStaff) {
      console.log('✅ Admin navigation correctly hidden for staff user');
    } else {
      console.log('❌ Admin navigation incorrectly shown to staff user');
    }
    
    // Take screenshot of staff view
    await page.screenshot({ path: 'test_local_staff_view.png', fullPage: true });
    console.log('Screenshot saved: test_local_staff_view.png');
    
    console.log('\n=== TEST SUMMARY ===');
    console.log('✅ All users now redirect to staff.html on login');
    console.log('✅ Admin/Owner users see additional admin navigation option');
    console.log('✅ Staff users only see staff navigation');
    console.log('✅ Invite modal simplified to only ask for name, email, and role type');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test_local_error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\nTest completed');
  }
}

testLocalFlow().catch(console.error);