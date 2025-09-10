import { chromium } from 'playwright';

async function testAdminFix() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('🔄 Testing Admin Navigation Fix\n');
    console.log('1. Loading GitHub Pages site...');
    await page.goto('https://magicmanben.github.io/CheckLoops/staff.html');
    await page.waitForTimeout(2000);
    
    // Check if we need to log in
    const needsLogin = await page.locator('#email').count() > 0;
    if (needsLogin) {
      console.log('2. Logging in as admin (benhowardmagic@hotmail.com)...');
      await page.locator('#email').fill('benhowardmagic@hotmail.com');
      await page.locator('#password').fill('Hello1!');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
    }
    
    // Wait for page to fully load
    console.log('3. Waiting for dashboard to load...');
    await page.waitForSelector('#welcome', { timeout: 10000 });
    
    // Check for admin navigation link in the top nav
    const adminNavLink = page.locator('.seg-nav a.admin-only:has-text("Admin Site")').first();
    const adminNavVisible = await adminNavLink.isVisible();
    
    if (adminNavVisible) {
      console.log('✅ Admin navigation link is visible in top nav');
      
      // Check the href
      const navHref = await adminNavLink.getAttribute('href');
      console.log(`   Navigation link href: ${navHref}`);
      
      // Click the navigation admin link
      console.log('4. Clicking Admin Site link in navigation bar...');
      const urlBefore = page.url();
      await adminNavLink.click();
      await page.waitForTimeout(3000);
      
      const urlAfter = page.url();
      console.log(`   Before: ${urlBefore}`);
      console.log(`   After:  ${urlAfter}`);
      
      if (urlAfter.includes('admin-dashboard.html')) {
        console.log('✅ SUCCESS: Navigation to admin-dashboard.html works correctly!');
        
        // Verify we're on the admin dashboard
        const adminTitle = await page.locator('h1:has-text("CheckLoop Admin")').count();
        if (adminTitle > 0) {
          console.log('✅ Admin dashboard loaded successfully');
        }
        
        // Take screenshot
        await page.screenshot({ path: 'admin_fix_success.png' });
        console.log('📸 Screenshot saved as admin_fix_success.png');
      } else if (urlAfter.includes('staff.html')) {
        console.log('❌ ISSUE PERSISTS: Still redirecting to staff.html');
        console.log('   The fix may not have been deployed to GitHub Pages yet.');
        console.log('   GitHub Pages can take a few minutes to update.');
      } else {
        console.log(`⚠️ Unexpected navigation to: ${urlAfter}`);
      }
    } else {
      console.log('⚠️ Admin navigation link not visible - checking role...');
      
      const roleText = await page.locator('#role-pill').textContent();
      console.log(`   Current role: ${roleText}`);
      
      if (!roleText.toLowerCase().includes('admin') && !roleText.toLowerCase().includes('owner')) {
        console.log('❌ User does not have admin/owner role');
      }
    }
    
    // Also test the admin panel button
    console.log('\n5. Testing admin panel button...');
    const adminPanel = await page.locator('#admin-access-panel').isVisible();
    
    if (adminPanel) {
      console.log('✅ Admin access panel is visible');
      
      const panelButton = page.locator('#admin-access-panel a:has-text("Admin Site")');
      const panelHref = await panelButton.getAttribute('href');
      console.log(`   Panel button href: ${panelHref}`);
      
      if (panelHref === 'admin-dashboard.html') {
        console.log('✅ Panel button has correct href');
      }
    } else {
      console.log('⚠️ Admin access panel not visible');
    }
    
    console.log('\n✨ Test completed!');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    await page.screenshot({ path: 'admin_fix_error.png' });
  } finally {
    console.log('\nClosing browser in 3 seconds...');
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testAdminFix().catch(console.error);