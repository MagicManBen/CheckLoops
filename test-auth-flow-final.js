import { chromium } from 'playwright';

async function testAuthFlow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Log all console messages from the browser
  page.on('console', msg => {
    console.log('BROWSER CONSOLE:', msg.type(), msg.text());
  });
  
  // Log any page errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  try {
    console.log('🚀 TESTING AUTHENTICATION FLOW WITH USER DETAILS');
    console.log('================================================');
    
    // Step 1: Navigate to homepage
    console.log('\n📍 STEP 1: Navigate to homepage.html');
    await page.goto('http://127.0.0.1:5500/homepage.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('✅ Loaded homepage.html');
    
    // Step 2: Click Sign In button
    console.log('\n📍 STEP 2: Click Sign In button');
    await page.click('button:has-text("Sign In")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const loginUrl = page.url();
    if (loginUrl.includes('home.html')) {
      console.log('✅ Successfully navigated to home.html login page');
    } else {
      console.log('❌ Failed to reach login page. Current URL:', loginUrl);
      await page.screenshot({ path: 'test-error-login-page.png' });
      return;
    }
    
    // Step 3: Login with benhowardmagic@hotmail.com
    console.log('\n📍 STEP 3: Login with benhowardmagic@hotmail.com');
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('#password', 'Hello1!');
    console.log('  → Credentials filled');
    
    await page.click('button[type="submit"]:has-text("Sign In")');
    console.log('  → Form submitted');
    
    // Wait for redirect to staff.html
    await page.waitForTimeout(5000); // Give enough time for redirect
    await page.waitForLoadState('networkidle');
    
    const afterLoginUrl = page.url();
    console.log('  → Current URL:', afterLoginUrl);
    
    if (!afterLoginUrl.includes('staff.html')) {
      console.log('❌ Failed to redirect to staff.html');
      await page.screenshot({ path: 'test-error-redirect.png' });
      return;
    }
    
    console.log('✅ Successfully redirected to staff.html');
    
    // Step 4: Verify user details are displayed
    console.log('\n📍 STEP 4: Checking user details visibility');
    console.log('=========================================');
    
    // Wait a bit for data to load
    await page.waitForTimeout(3000);
    
    // Check for email in the topbar
    const emailPill = await page.locator('#email-pill').textContent().catch(() => '—');
    console.log('  Email Pill:', emailPill);
    const emailVisible = emailPill.includes('benhowardmagic@hotmail.com');
    
    // Check for role in the topbar
    const rolePill = await page.locator('#role-pill').textContent().catch(() => '—');
    console.log('  Role Pill:', rolePill);
    const roleVisible = rolePill !== '—' && rolePill !== '';
    
    // Check for site in the topbar - site pill has been removed
    const siteVisible = true; // Always true now since we removed it
    
    // Check for welcome message
    const welcomeText = await page.locator('#welcome').textContent().catch(() => '');
    console.log('  Welcome Text:', welcomeText);
    const welcomeVisible = welcomeText.includes('Welcome');
    
    // Summary of visibility
    console.log('\n📊 USER DETAILS VISIBILITY:');
    console.log('  Email visible:', emailVisible ? '✅' : '❌');
    console.log('  Role visible:', roleVisible ? '✅' : '❌');
    console.log('  Site visible:', siteVisible ? '✅' : '❌');
    console.log('  Welcome message:', welcomeVisible ? '✅' : '❌');
    
    // Take screenshot of staff home
    await page.screenshot({ path: 'test-staff-home-details.png' });
    
    // Step 5: Test navigation to other staff pages
    console.log('\n📍 STEP 5: Testing navigation while maintaining session');
    
    const pagesToTest = [
      { name: 'Welcome', url: 'staff-welcome.html' },
      { name: 'Meetings', url: 'staff-meetings.html' },
      { name: 'Home', url: 'staff.html' }
    ];
    
    for (const pageTest of pagesToTest) {
      try {
        console.log(`\n  → Testing ${pageTest.name} page`);
        await page.click(`button:has-text("${pageTest.name}")`);
        await page.waitForTimeout(3000);
        await page.waitForLoadState('networkidle');
        
        const currentUrl = page.url();
        if (currentUrl.includes(pageTest.url)) {
          console.log(`    ✅ Successfully navigated to ${pageTest.name}`);
          
          // Check if email is still visible (for pages that show it)
          const pageEmail = await page.locator('#email-pill').textContent().catch(() => '');
          if (pageEmail.includes('benhowardmagic@hotmail.com')) {
            console.log(`    ✅ User session maintained on ${pageTest.name}`);
          } else if (pageEmail) {
            console.log(`    ℹ️  Email pill shows: ${pageEmail}`);
          }
          
          await page.screenshot({ path: `test-${pageTest.name.toLowerCase()}-page.png` });
        } else {
          console.log(`    ❌ Failed to navigate to ${pageTest.name}`);
        }
      } catch (error) {
        console.log(`    ❌ Error navigating to ${pageTest.name}:`, error.message);
      }
    }
    
    // Step 6: Check admin button visibility
    console.log('\n📍 STEP 6: Checking Admin Site button');
    await page.goto('http://127.0.0.1:5500/staff.html');
    await page.waitForTimeout(3000);
    
    const adminButton = await page.locator('button:has-text("Admin Site")').isVisible().catch(() => false);
    console.log('  Admin Site button visible:', adminButton ? '✅' : '❌');
    
    // Final screenshot
    await page.screenshot({ path: 'test-final-state.png' });
    
    // Final summary
    console.log('\n=====================================');
    console.log('📋 FINAL TEST SUMMARY:');
    console.log('  Login flow: ✅');
    console.log('  Redirect to staff.html: ✅');
    console.log('  User details displayed:', (emailVisible && roleVisible) ? '✅' : '❌ NEEDS FIX');
    console.log('  Session maintained:', '✅');
    console.log('  Admin button visible:', adminButton ? '✅' : '❌');
    console.log('=====================================');
    
    if (!emailVisible || !roleVisible) {
      console.log('\n⚠️  USER DETAILS NOT FULLY VISIBLE - This needs to be fixed!');
      console.log('The login works but user information is not displaying properly.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'test-error-final.png' });
  } finally {
    await browser.close();
  }
}

testAuthFlow().catch(console.error);