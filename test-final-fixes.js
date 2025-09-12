import { chromium } from 'playwright';

async function testFinalFixes() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Log console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  
  try {
    console.log('🚀 TESTING FINAL FIXES');
    console.log('====================');
    
    // Step 1: Login flow
    console.log('\n📍 Step 1: Testing login flow');
    await page.goto('http://127.0.0.1:5500/homepage.html');
    await page.waitForTimeout(2000);
    
    await page.click('button:has-text("Sign In")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('#password', 'Hello1!');
    await page.click('button[type="submit"]:has-text("Sign In")');
    
    await page.waitForTimeout(5000);
    await page.waitForLoadState('networkidle');
    
    if (page.url().includes('staff.html')) {
      console.log('✅ Login successful, redirected to staff.html');
    } else {
      console.log('❌ Login failed, current URL:', page.url());
      return;
    }
    
    // Step 2: Test staff-welcome.html session
    console.log('\n📍 Step 2: Testing staff-welcome.html');
    await page.click('button:has-text("Welcome")');
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    
    const welcomeUrl = page.url();
    if (welcomeUrl.includes('staff-welcome.html')) {
      console.log('✅ Successfully navigated to staff-welcome.html');
      
      // Check if still logged in (no redirect to login)
      await page.waitForTimeout(3000);
      if (page.url().includes('staff-welcome.html')) {
        console.log('✅ Session maintained on staff-welcome.html');
        
        // Check for user details on welcome page
        const topbarEmail = await page.locator('#email-pill').textContent().catch(() => '');
        if (topbarEmail) {
          console.log(`✅ Email visible on welcome page: ${topbarEmail}`);
        } else {
          console.log('ℹ️  Email not in topbar on welcome page (may be normal)');
        }
      } else {
        console.log('❌ Lost session, redirected to:', page.url());
      }
    } else {
      console.log('❌ Failed to navigate to welcome page');
    }
    
    await page.screenshot({ path: 'test-welcome-page.png' });
    
    // Step 3: Go back to staff home
    console.log('\n📍 Step 3: Return to staff home');
    await page.goto('http://127.0.0.1:5500/staff.html');
    await page.waitForTimeout(3000);
    
    if (page.url().includes('staff.html')) {
      console.log('✅ Back on staff.html with session');
    }
    
    // Step 4: Test Admin Site button and index.html
    console.log('\n📍 Step 4: Testing Admin Site access via index.html');
    
    const adminButton = await page.locator('button:has-text("Admin Site")').first();
    const adminVisible = await adminButton.isVisible().catch(() => false);
    
    if (adminVisible) {
      console.log('✅ Admin Site button visible');
      await adminButton.click();
      await page.waitForTimeout(5000); // Give time for redirects
      await page.waitForLoadState('networkidle');
      
      const adminUrl = page.url();
      console.log('Current URL after Admin Site click:', adminUrl);
      
      if (adminUrl.includes('admin.html')) {
        console.log('✅ Successfully redirected to admin.html');
        console.log('✅ index.html correctly verified admin access and redirected');
        await page.screenshot({ path: 'test-admin-access-success.png' });
      } else if (adminUrl.includes('index.html')) {
        console.log('❌ Stuck on index.html - admin verification not working');
        await page.screenshot({ path: 'test-admin-stuck.png' });
      } else {
        console.log('⚠️  Unexpected redirect to:', adminUrl);
      }
    } else {
      console.log('❌ Admin Site button not visible');
    }
    
    // Final summary
    console.log('\n=====================================');
    console.log('📋 FINAL TEST RESULTS:');
    console.log('  staff-welcome.html session:', welcomeUrl.includes('staff-welcome.html') ? '✅ FIXED' : '❌ BROKEN');
    console.log('  index.html admin redirect:', adminUrl?.includes('admin.html') ? '✅ FIXED' : '❌ BROKEN');
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page.screenshot({ path: 'test-error-screenshot.png' });
  } finally {
    await browser.close();
  }
}

testFinalFixes().catch(console.error);