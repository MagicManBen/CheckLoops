import { chromium } from 'playwright';

async function debugWorkingHours() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });

  const page = await browser.newPage();

  // Capture ALL console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    console.log('[BROWSER]', type, ':', text);
  });

  try {
    // Navigate directly to welcome page
    console.log('\n=== Navigate to Welcome Page ===');
    await page.goto('http://127.0.0.1:58156/staff-welcome.html');
    await page.waitForTimeout(1000);

    // Login if needed
    if (await page.locator('#email').count() > 0) {
      console.log('\n=== Login ===');
      await page.fill('#email', 'benhowardmagic@hotmail.com');
      await page.fill('input[type="password"]', 'Hello1!');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(2000);
    }

    // Run simple navigation test directly
    console.log('\n=== Testing Navigation Directly ===');
    const navResult = await page.evaluate(() => {
      // Find elements
      const step3 = document.getElementById('welcome-step3');
      const step4 = document.getElementById('step4');
      
      const results = {
        step3Found: !!step3,
        step4Found: !!step4
      };

      if (step3 && step4) {
        // Show step 3 first
        step3.style.display = 'block';
        step4.style.display = 'none';
        
        // Now switch to step 4
        step3.style.display = 'none';
        step4.style.display = 'block';
        
        results.step4NowVisible = step4.style.display === 'block';
        results.step3NowHidden = step3.style.display === 'none';
      }

      return results;
    });

    console.log('\nDirect Navigation Test Results:');
    console.log('  Step 3 found:', navResult.step3Found);
    console.log('  Step 4 found:', navResult.step4Found);
    console.log('  Step 3 hidden:', navResult.step3NowHidden);
    console.log('  Step 4 visible:', navResult.step4NowVisible);

    if (navResult.step4NowVisible) {
      console.log('\nSUCCESS: Direct navigation to step 4 works!');
      console.log('The issue must be in the button handler code.');
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    console.log('\n=== Test Complete ===');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

debugWorkingHours().catch(console.error);