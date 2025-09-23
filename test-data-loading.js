import { chromium } from 'playwright';

async function testDataLoading() {
  console.log('🔍 Testing data loading on staff portal after fixes...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor console for CSP and loading errors
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      if (text.includes('Content Security Policy')) {
        console.log(`❌ CSP ERROR: ${text}`);
      } else if (text.includes('Failed to load') || text.includes('404')) {
        console.log(`❌ LOAD ERROR: ${text}`);
      }
    }
  });

  try {
    console.log('1️⃣ Logging in...');
    await page.goto('https://checkloops.co.uk/home.html', { waitUntil: 'networkidle' });

    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('#password', 'Hello1!');
    await page.click('#signin-form button[type="submit"]');

    // Wait for redirect to staff portal
    await page.waitForURL('**/staff.html', { timeout: 15000 });
    console.log('✅ Successfully logged in and redirected to staff portal');

    console.log('2️⃣ Checking staff dashboard data loading...');
    await page.waitForTimeout(3000); // Allow time for data to load

    // Check if data is loading/loaded
    const dashboardData = await page.evaluate(() => {
      const trainingCompliance = document.querySelector('[data-metric="training-compliance"]')?.textContent || 'Not found';
      const lastQuizScore = document.querySelector('[data-metric="quiz-score"]')?.textContent || 'Not found';
      const holidayRemaining = document.querySelector('[data-metric="holiday-remaining"]')?.textContent || 'Not found';
      const activeAlerts = document.querySelector('[data-metric="active-alerts"]')?.textContent || 'Not found';

      // Check loading states
      const loadingElements = Array.from(document.querySelectorAll('[data-loading="true"], .loading, .spinner')).length;
      const recentActivityText = document.querySelector('#recent-activity')?.textContent || '';

      return {
        trainingCompliance,
        lastQuizScore,
        holidayRemaining,
        activeAlerts,
        loadingElements,
        hasLoadingActivities: recentActivityText.includes('Loading activities'),
        hasUserWelcome: document.querySelector('.welcome, .user-greeting')?.textContent || 'No greeting found'
      };
    });

    console.log('📊 Dashboard Data Check:');
    console.log(`   Training Compliance: ${dashboardData.trainingCompliance}`);
    console.log(`   Last Quiz Score: ${dashboardData.lastQuizScore}`);
    console.log(`   Holiday Remaining: ${dashboardData.holidayRemaining}`);
    console.log(`   Active Alerts: ${dashboardData.activeAlerts}`);
    console.log(`   Loading Elements: ${dashboardData.loadingElements}`);
    console.log(`   Still Loading Activities: ${dashboardData.hasLoadingActivities}`);
    console.log(`   User Greeting: ${dashboardData.hasUserWelcome}`);

    console.log('3️⃣ Testing holidays page...');
    await page.goto('https://checkloops.co.uk/my-holidays.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const holidayData = await page.evaluate(() => {
      const totalAllowance = document.querySelector('[data-metric="total-allowance"]')?.textContent || 'Not found';
      const usedHours = document.querySelector('[data-metric="used-hours"]')?.textContent || 'Not found';
      const remainingHours = document.querySelector('[data-metric="remaining-hours"]')?.textContent || 'Not found';

      // Check if data shows non-zero values
      const hasRealData = ![totalAllowance, usedHours, remainingHours].every(val => val.includes('0') || val === 'Not found');

      return {
        totalAllowance,
        usedHours,
        remainingHours,
        hasRealData,
        pageTitle: document.title
      };
    });

    console.log('🏖️ Holiday Data Check:');
    console.log(`   Total Allowance: ${holidayData.totalAllowance}`);
    console.log(`   Used Hours: ${holidayData.usedHours}`);
    console.log(`   Remaining Hours: ${holidayData.remainingHours}`);
    console.log(`   Has Real Data: ${holidayData.hasRealData}`);
    console.log(`   Page Title: ${holidayData.pageTitle}`);

    // Overall assessment
    console.log('\n🎯 RESULTS:');
    if (!dashboardData.hasLoadingActivities && dashboardData.loadingElements === 0) {
      console.log('✅ Dashboard loading appears to be working (no stuck loading states)');
    } else {
      console.log('❌ Dashboard still showing loading issues');
    }

    if (holidayData.hasRealData) {
      console.log('✅ Holiday data appears to be loading');
    } else {
      console.log('❌ Holiday data still showing as zeros');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n⏳ Keeping browser open for 5 seconds for manual inspection...');
  await page.waitForTimeout(5000);
  await browser.close();
}

// Wait for deployment, then test
console.log('⏳ Waiting 45 seconds for GitHub Pages deployment...');
setTimeout(testDataLoading, 45000);