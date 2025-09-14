import { chromium } from 'playwright';

async function testWelcomeDebug() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const page = await browser.newPage();

  // Capture ALL console messages for debugging
  page.on('console', msg => {
    console.log('[Browser]', msg.text());
  });

  try {
    console.log('=== WELCOME DEBUG TEST ===\n');

    // 1. Login
    console.log('1. Logging in...');
    await page.goto('http://127.0.0.1:5500/Home.html');
    await page.waitForTimeout(1000);
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);

    // Navigate to staff portal
    const currentUrl = page.url();
    if (currentUrl.includes('admin-dashboard.html')) {
      console.log('   On admin dashboard, going to staff portal...');
      await page.goto('http://127.0.0.1:5500/staff.html');
      await page.waitForTimeout(1500);
    }

    // 2. Go to Welcome page
    console.log('\n2. Opening Welcome page...');
    await page.click('button[data-section="welcome"]');
    await page.waitForTimeout(3000);

    // Check what's visible
    console.log('\n3. Checking what elements are visible...');
    const elements = [
      { name: 'Nickname field', selector: '#nickname' },
      { name: 'Get Started button', selector: 'button:has-text("Get started")' },
      { name: 'Step 1', selector: '#welcome-step1' },
      { name: 'Step 2', selector: '#welcome-step2' },
      { name: 'Role grid', selector: '#role-grid' },
      { name: 'Team grid', selector: '#team-grid' },
      { name: 'To Avatar button', selector: '#to-avatar-btn' }
    ];

    for (const el of elements) {
      const isVisible = await page.locator(el.selector).isVisible();
      console.log(`   ${el.name}: ${isVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);
    }

    // Step 1: Nickname
    const nicknameField = await page.locator('#nickname');
    if (await nicknameField.isVisible()) {
      console.log('\n4. Filling nickname...');
      await nicknameField.clear();
      await nicknameField.fill('Debug_' + Date.now());

      const getStartedBtn = await page.locator('button:has-text("Get started")');
      if (await getStartedBtn.isVisible()) {
        console.log('   Clicking Get Started...');
        await getStartedBtn.click();
        await page.waitForTimeout(4000);
      }
    }

    // Check what's visible after clicking Get Started
    console.log('\n5. After Get Started - checking visibility...');
    for (const el of elements) {
      const isVisible = await page.locator(el.selector).isVisible();
      if (isVisible) {
        console.log(`   ${el.name}: ✅ VISIBLE`);
      }
    }

    // Check role grid content
    const roleGrid = await page.locator('#role-grid');
    if (await roleGrid.isVisible()) {
      const roleGridHTML = await roleGrid.innerHTML();
      console.log('\n6. Role grid content:');
      if (roleGridHTML.includes('Loading')) {
        console.log('   Still loading...');
      } else if (roleGridHTML.includes('button') || roleGridHTML.includes('label')) {
        const roleCount = await page.locator('#role-grid button, #role-grid label').count();
        console.log('   Found', roleCount, 'role options');
      } else {
        console.log('   Empty or error:', roleGridHTML.substring(0, 100));
      }
    }

    // Check team grid content
    const teamGrid = await page.locator('#team-grid');
    if (await teamGrid.isVisible()) {
      const teamGridHTML = await teamGrid.innerHTML();
      console.log('\n7. Team grid content:');
      if (teamGridHTML.includes('Loading')) {
        console.log('   Still loading...');
      } else if (teamGridHTML.includes('button') || teamGridHTML.includes('label')) {
        const teamCount = await page.locator('#team-grid button, #team-grid label').count();
        console.log('   Found', teamCount, 'team options');
      } else {
        console.log('   Content:', teamGridHTML.substring(0, 200));
      }
    }

    console.log('\n=== DEBUG COMPLETE ===');

  } catch (error) {
    console.error('\n❌ Test error:', error);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testWelcomeDebug().catch(console.error);
