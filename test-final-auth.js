import { chromium } from 'playwright';

async function testFinalAuth() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== FINAL AUTHENTICATION TEST ===\n');

  try {
    // 1. Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('file:///Users/benhoward/Desktop/CheckLoop/CheckLoops/home.html');
    await page.waitForTimeout(2000);

    // 2. Fill in login credentials
    console.log('2. Logging in as benhowardmagic@hotmail.com...');
    await page.fill('input[type="email"]', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');

    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('[Auth]') || msg.text().includes('bypass')) {
        console.log('   Browser console:', msg.text());
      }
    });

    // 3. Click login button
    console.log('3. Clicking Sign In button...');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);

    // 4. Check current URL
    const currentURL = page.url();
    console.log('4. Current location:', currentURL.split('/').pop());

    // If on welcome page, navigate to staff.html
    if (currentURL.includes('staff-welcome.html')) {
      console.log('5. On welcome page, navigating to staff.html...');
      await page.goto('file:///Users/benhoward/Desktop/CheckLoop/CheckLoops/staff.html');
      await page.waitForTimeout(3000);
    }

    // 6. Check role badge
    console.log('\n6. CHECKING ROLE BADGE:');
    try {
      const roleBadge = await page.locator('#role-pill').textContent();
      if (roleBadge === 'Admin') {
        console.log('   ✅ SUCCESS: Badge displays "Admin"');
      } else {
        console.log('   ❌ FAIL: Badge displays "' + roleBadge + '"');
      }
    } catch (e) {
      console.log('   ❌ FAIL: Could not find role badge');
    }

    // 7. Check Admin Portal button
    console.log('\n7. CHECKING ADMIN PORTAL BUTTON:');
    const adminButtons = await page.locator('button:has-text("Admin Portal")').count();
    if (adminButtons > 0) {
      console.log('   ✅ SUCCESS: Admin Portal button is visible');

      // Try clicking it
      console.log('\n8. Clicking Admin Portal button...');
      await page.click('button:has-text("Admin Portal")');
      await page.waitForTimeout(3000);

      const newURL = page.url();
      if (newURL.includes('admin')) {
        console.log('   ✅ SUCCESS: Navigated to admin area');
      } else {
        console.log('   ❌ FAIL: Did not navigate to admin');
      }
    } else {
      console.log('   ❌ FAIL: Admin Portal button NOT found');
    }

    // 9. Direct admin-dashboard test
    console.log('\n9. DIRECT ADMIN DASHBOARD TEST:');
    await page.goto('file:///Users/benhoward/Desktop/CheckLoop/CheckLoops/admin-dashboard.html');
    await page.waitForTimeout(5000);

    const finalURL = page.url();
    if (finalURL.includes('admin-dashboard.html')) {
      console.log('   ✅ SUCCESS: Can access admin-dashboard.html');

      // Check for content
      const hasContent = await page.locator('h1, h2').count();
      if (hasContent > 0) {
        const firstHeading = await page.locator('h1, h2').first().textContent();
        console.log('   ✅ Dashboard content loaded:', firstHeading);
      }
    } else {
      console.log('   ❌ FAIL: Redirected away from admin-dashboard');
      console.log('   Current page:', finalURL.split('/').pop());
    }

    console.log('\n=== TEST COMPLETE ===\n');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    console.log('Browser will close in 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testFinalAuth().catch(console.error);