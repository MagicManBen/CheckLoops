import { chromium } from 'playwright';

async function testAdminLogin() {
  console.log('🎯 Testing admin login flow after infinite loop fixes...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor console for our debug messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Admin') || text.includes('login') || text.includes('Dashboard')) {
      console.log(`🔍 [CONSOLE]: ${text}`);
    }
    if (msg.type() === 'error' && text.includes('CSP')) {
      console.log(`❌ [CSP ERROR]: ${text}`);
    }
  });

  try {
    console.log('1️⃣ Navigating to admin login page...');
    await page.goto('https://checkloops.co.uk/admin-login.html', {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    console.log('2️⃣ Filling admin credentials...');
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('#password', 'Hello1!');

    console.log('3️⃣ Clicking login button...');
    await page.click('button[type="submit"]');

    console.log('4️⃣ Waiting for redirect and checking for loop...');

    // Monitor URL changes for 10 seconds to detect loops
    const urlChanges = [];
    const startTime = Date.now();

    let currentUrl = page.url();
    urlChanges.push({ url: currentUrl, time: 0 });

    // Monitor for 10 seconds
    while (Date.now() - startTime < 10000) {
      await page.waitForTimeout(500);
      const newUrl = page.url();
      if (newUrl !== currentUrl) {
        const elapsed = Date.now() - startTime;
        urlChanges.push({ url: newUrl, time: elapsed });
        currentUrl = newUrl;
        console.log(`   URL changed after ${elapsed}ms: ${newUrl}`);

        // If we see more than 3 URL changes, likely a loop
        if (urlChanges.length > 4) {
          console.log('❌ DETECTED REDIRECT LOOP - Too many URL changes!');
          break;
        }
      }

      // If we end up on dashboard and stay there, success
      if (newUrl.includes('admin-dashboard.html')) {
        await page.waitForTimeout(2000); // Wait 2 more seconds
        if (page.url() === newUrl) {
          console.log('✅ Successfully stayed on admin dashboard!');
          break;
        }
      }
    }

    console.log('\n📊 URL Change History:');
    urlChanges.forEach((change, i) => {
      console.log(`   ${i + 1}. [${change.time}ms] ${change.url}`);
    });

    // Check final state
    const finalUrl = page.url();
    console.log(`\n🏁 Final URL: ${finalUrl}`);

    if (finalUrl.includes('admin-dashboard.html')) {
      // Check if user info is displayed correctly
      const userInfo = await page.evaluate(() => {
        const userText = document.querySelector('.user-info, [data-user], .profile')?.textContent || '';
        const hasUserEmail = userText.includes('@') || userText.toLowerCase().includes('ben');
        const showsUser = userText.includes('User') && !userText.includes('@');

        return {
          userText: userText.trim(),
          hasUserEmail,
          showsUser,
          pageTitle: document.title
        };
      });

      console.log('\n👤 User Display Check:');
      console.log(`   Text found: "${userInfo.userText}"`);
      console.log(`   Shows email/name: ${userInfo.hasUserEmail}`);
      console.log(`   Shows generic "User": ${userInfo.showsUser}`);
      console.log(`   Page title: ${userInfo.pageTitle}`);

      if (userInfo.hasUserEmail) {
        console.log('✅ SUCCESS: Admin login working properly!');
        console.log('✅ User is properly logged in and recognized');
      } else if (userInfo.showsUser) {
        console.log('⚠️  PARTIAL SUCCESS: Reached dashboard but user not recognized');
        console.log('   This suggests session is not being read properly');
      } else {
        console.log('✅ SUCCESS: No redirect loop, reached dashboard');
      }
    } else if (finalUrl.includes('admin-login.html')) {
      if (urlChanges.length > 3) {
        console.log('❌ FAILED: Still experiencing redirect loop');
      } else {
        console.log('❌ FAILED: Ended back at login (authentication failed)');
      }
    } else {
      console.log('❓ UNKNOWN: Ended at unexpected page');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n⏳ Keeping browser open for 5 seconds for inspection...');
  await page.waitForTimeout(5000);
  await browser.close();
}

// Wait for deployment then test
console.log('⏳ Waiting 45 seconds for GitHub Pages deployment...');
setTimeout(testAdminLogin, 45000);