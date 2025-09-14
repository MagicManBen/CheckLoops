import { chromium } from 'playwright';

async function testCompletionFixed() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('SUCCESS') || text.includes('saved') || text.includes('step5') || text.includes('confetti')) {
      console.log('[Browser]', text);
    }
  });

  try {
    console.log('=== COMPLETION SCREEN TEST ===\n');

    // Login
    console.log('1. Logging in...');
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);

    // Go to welcome page
    console.log('2. Going to Welcome page...');
    await page.goto('http://127.0.0.1:58156/staff-welcome.html?force=1');
    await page.waitForTimeout(1500);

    // Manually trigger completion screen
    console.log('3. Manually showing completion screen...');
    await page.evaluate(() => {
      // Hide all other steps
      ['welcome-step1', 'welcome-step2', 'welcome-step3', 'step4'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });

      // Show step 5
      const step5 = document.getElementById('step5');
      if (step5) {
        step5.style.display = 'block';
        console.log('Step 5 shown manually');

        // Try to trigger confetti
        if (typeof burstConfetti === 'function') {
          burstConfetti();
          console.log('Confetti triggered!');
        } else if (typeof window.burstConfetti === 'function') {
          window.burstConfetti();
          console.log('Window confetti triggered!');
        } else {
          console.log('Confetti function not found');
        }

        // Try to trigger balloons
        if (typeof showBalloons === 'function') {
          showBalloons();
          console.log('Balloons triggered!');
        } else if (typeof window.showBalloons === 'function') {
          window.showBalloons();
          console.log('Window balloons triggered!');
        } else {
          console.log('Balloons function not found');
        }
      } else {
        console.log('Step 5 element not found!');
      }
    });

    await page.waitForTimeout(2000);

    // Check if completion screen is visible
    const step5Visible = await page.isVisible('#step5');
    console.log('\n4. Completion screen visible:', step5Visible);

    if (step5Visible) {
      console.log('   ✅ SUCCESS! Completion screen is showing!');

      // Take screenshot
      await page.screenshot({ path: 'test_completion_fixed.png' });
      console.log('   Screenshot saved: test_completion_fixed.png');

      // Check for celebration elements
      const confettiCount = await page.locator('.bit').count();
      console.log('   Confetti pieces found:', confettiCount);

      // Wait to see animations
      await page.waitForTimeout(3000);

    } else {
      console.log('   ❌ Completion screen not visible');
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    console.log('\n=== TEST COMPLETE ===');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testCompletionFixed().catch(console.error);