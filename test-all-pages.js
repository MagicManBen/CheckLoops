import { chromium } from 'playwright';

async function testAllPages() {
  console.log('🔍 Testing all fixed pages after comprehensive CSP fixes...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Track CSP and loading errors
  const errors = [];
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      if (text.includes('Content Security Policy')) {
        errors.push(`CSP ERROR: ${text}`);
      } else if (text.includes('Failed to load') || text.includes('404')) {
        errors.push(`LOAD ERROR: ${text}`);
      }
    }
  });

  try {
    console.log('1️⃣ Logging in...');
    await page.goto('https://checkloops.co.uk/home.html', { waitUntil: 'networkidle' });
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('#password', 'Hello1!');
    await page.click('#signin-form button[type="submit"]');
    await page.waitForURL('**/staff.html', { timeout: 15000 });
    console.log('✅ Login successful');

    const pagesToTest = [
      { url: 'staff.html', name: 'Staff Dashboard' },
      { url: 'staff-training.html', name: 'Training Page' },
      { url: 'staff-quiz.html', name: 'Quiz Page' },
      { url: 'staff-welcome.html', name: 'Welcome Page' },
      { url: 'staff-calendar.html', name: 'Calendar Page' },
      { url: 'achievements.html', name: 'Achievements Page' },
      { url: 'my-holidays.html', name: 'Holidays Page' }
    ];

    const results = {};

    for (const testPage of pagesToTest) {
      console.log(`\n2️⃣ Testing ${testPage.name}...`);
      const initialErrorCount = errors.length;

      try {
        await page.goto(`https://checkloops.co.uk/${testPage.url}`, {
          waitUntil: 'networkidle',
          timeout: 10000
        });

        // Wait for page to load
        await page.waitForTimeout(2000);

        // Check for basic functionality indicators
        const pageStatus = await page.evaluate(() => {
          // Check if user appears to be logged in
          const hasSignOut = document.querySelector('[data-action="logout"], [onclick*="logout"], [onclick*="signOut"]') ||
                             document.textContent.includes('Sign Out') ||
                             document.textContent.includes('Logout');

          // Check for loading indicators
          const hasLoadingElements = document.querySelectorAll('.loading, [data-loading="true"], .spinner').length;

          // Check for data indicators (non-zero numbers, populated fields)
          const hasContent = document.querySelectorAll('input, select, button, .card, .metric, [data-metric]').length > 5;

          return {
            hasSignOut,
            hasLoadingElements,
            hasContent,
            title: document.title,
            url: window.location.href
          };
        });

        const newErrorCount = errors.length;
        const hasNewErrors = newErrorCount > initialErrorCount;

        results[testPage.name] = {
          status: hasNewErrors ? 'ERROR' : 'OK',
          ...pageStatus,
          newErrors: hasNewErrors ? errors.slice(initialErrorCount) : []
        };

        if (hasNewErrors) {
          console.log(`❌ ${testPage.name}: ${newErrorCount - initialErrorCount} new errors`);
        } else {
          console.log(`✅ ${testPage.name}: No new errors`);
        }

      } catch (error) {
        console.log(`❌ ${testPage.name}: Failed to load - ${error.message}`);
        results[testPage.name] = {
          status: 'FAILED',
          error: error.message
        };
      }
    }

    // Test admin dashboard separately (requires admin login)
    console.log(`\n3️⃣ Testing Admin Dashboard...`);
    try {
      await page.goto('https://checkloops.co.uk/admin-login.html', { waitUntil: 'networkidle' });
      await page.fill('#email', 'benhowardmagic@hotmail.com');
      await page.fill('#password', 'Hello1!');
      await page.click('button[type="submit"]');

      await page.waitForTimeout(3000);

      const adminStatus = await page.evaluate(() => {
        const hasAdminContent = document.textContent.includes('Admin') ||
                               document.textContent.includes('Dashboard') ||
                               document.querySelector('[data-section], .admin-section, .dashboard');

        return {
          hasAdminContent,
          url: window.location.href,
          title: document.title
        };
      });

      results['Admin Dashboard'] = {
        status: adminStatus.hasAdminContent ? 'OK' : 'LIMITED',
        ...adminStatus
      };

      console.log(`✅ Admin Dashboard: ${adminStatus.hasAdminContent ? 'Working' : 'Limited functionality'}`);

    } catch (error) {
      console.log(`❌ Admin Dashboard: Failed - ${error.message}`);
      results['Admin Dashboard'] = { status: 'FAILED', error: error.message };
    }

    // Summary
    console.log('\n🎯 FINAL RESULTS:');
    console.log('================');

    for (const [pageName, result] of Object.entries(results)) {
      const status = result.status === 'OK' ? '✅' :
                    result.status === 'LIMITED' ? '⚠️' : '❌';
      console.log(`${status} ${pageName}: ${result.status}`);

      if (result.hasSignOut !== undefined) {
        console.log(`   - User logged in: ${result.hasSignOut ? 'Yes' : 'No'}`);
        console.log(`   - Has content: ${result.hasContent ? 'Yes' : 'No'}`);
        console.log(`   - Loading elements: ${result.hasLoadingElements}`);
      }

      if (result.newErrors && result.newErrors.length > 0) {
        console.log(`   - New errors: ${result.newErrors.length}`);
      }
    }

    const successCount = Object.values(results).filter(r => r.status === 'OK').length;
    const totalCount = Object.keys(results).length;

    console.log(`\n📊 Overall: ${successCount}/${totalCount} pages working properly`);

    if (errors.length > 0) {
      console.log(`\n⚠️ Total errors encountered: ${errors.length}`);
      console.log('Recent errors:');
      errors.slice(-5).forEach(error => console.log(`  - ${error}`));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n⏳ Keeping browser open for 10 seconds for manual inspection...');
  await page.waitForTimeout(10000);
  await browser.close();
}

// Wait for deployment then test
console.log('⏳ Waiting 60 seconds for GitHub Pages deployment...');
setTimeout(testAllPages, 60000);