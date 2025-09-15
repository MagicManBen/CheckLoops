import { chromium } from 'playwright';

async function testNavigationFix() {
  console.log('Starting navigation test...');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down to observe the behavior
  });

  try {
    const page = await browser.newPage();

    // First test: Direct navigation to index.html
    console.log('1. Testing direct navigation to index.html...');
    await page.goto('http://127.0.0.1:58156/index.html');
    await page.waitForLoadState('networkidle');

    // Take screenshot of homepage
    await page.screenshot({ path: 'homepage.png' });
    console.log('Homepage loaded successfully');

    // Click Staff Login button and monitor navigation
    console.log('2. Clicking Staff Login button...');

    // Set up navigation monitoring
    let navigationCount = 0;
    const navigationLog = [];

    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        navigationCount++;
        const url = frame.url();
        navigationLog.push(url);
        console.log(`  Navigation ${navigationCount}: ${url}`);
      }
    });

    // Click the Staff Login button in the header
    await page.click('.auth-buttons button:has-text("Staff Login")');

    // Wait a moment to see if there's a redirect loop
    console.log('3. Monitoring for redirect loops (5 seconds)...');
    await page.waitForTimeout(5000);

    // Take screenshot of where we ended up
    await page.screenshot({ path: 'after_staff_login_click.png' });

    // Check results
    console.log('\n=== Navigation Analysis ===');
    console.log(`Total navigations: ${navigationCount}`);
    console.log('Navigation history:', navigationLog);

    // Check if we're on home.html
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (navigationCount > 2) {
      console.error('❌ REDIRECT LOOP DETECTED!');
      console.error('Too many navigations occurred. This indicates a redirect loop.');
    } else if (currentUrl.includes('home.html')) {
      console.log('✅ Successfully navigated to home.html');
    } else {
      console.log('⚠️ Did not reach home.html as expected');
      console.log(`Instead at: ${currentUrl}`);
    }

    // Test the hero section Staff Login button too
    console.log('\n4. Testing hero section Staff Login button...');
    await page.goto('http://127.0.0.1:58156/index.html');
    await page.waitForLoadState('networkidle');

    navigationCount = 0;
    navigationLog.length = 0;

    // Click the Staff Login button in the hero section
    await page.click('.hero-ctas button:has-text("Staff Login")');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'hero_staff_login_result.png' });

    console.log('\n=== Hero Button Navigation Analysis ===');
    console.log(`Total navigations: ${navigationCount}`);
    console.log('Navigation history:', navigationLog);
    console.log(`Current URL: ${page.url()}`);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
    console.log('\nTest completed. Check the screenshots for visual confirmation.');
  }
}

testNavigationFix().catch(console.error);