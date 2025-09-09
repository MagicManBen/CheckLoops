import { chromium } from 'playwright';

async function testNewQuiz() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();
  
  try {
    // Clear cache and navigate
    console.log('1. Navigating to staff-quiz.html with cache cleared...');
    await page.goto('http://127.0.0.1:58156/staff-quiz.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Take screenshot to see what loads
    await page.screenshot({ path: 'quiz_initial_load.png' });
    console.log('   Screenshot: quiz_initial_load.png');
    
    // Check for new UI elements
    const newUIPresent = await page.locator('.welcome-banner').count() > 0;
    const oldUIPresent = await page.locator('text="Your Weekly Quiz is Due!"').count() > 0;
    
    console.log('2. UI Check:');
    console.log('   - New UI present:', newUIPresent);
    console.log('   - Old UI present:', oldUIPresent);
    
    // Login if needed
    if (await page.locator('#email').isVisible()) {
      console.log('3. Logging in...');
      await page.locator('#email').fill('benhowardmagic@hotmail.com');
      await page.locator('#password').fill('Hello1!');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
      await page.goto('http://127.0.0.1:58156/staff-quiz.html', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
    }
    
    // Check again after login
    await page.screenshot({ path: 'quiz_after_login.png' });
    console.log('   Screenshot: quiz_after_login.png');
    
    // Look for the new UI elements
    console.log('\n4. Checking for new quiz UI elements...');
    const welcomeBanner = await page.locator('.welcome-banner').count();
    const modeCards = await page.locator('.mode-card').count();
    const btnPractice = await page.locator('#btn-practice').count();
    const btnRequired = await page.locator('#btn-required').count();
    
    console.log('   - Welcome banner:', welcomeBanner > 0 ? '✓' : '✗');
    console.log('   - Mode cards:', modeCards);
    console.log('   - Practice button:', btnPractice > 0 ? '✓' : '✗');
    console.log('   - Required button:', btnRequired > 0 ? '✓' : '✗');
    
    if (btnPractice > 0) {
      console.log('\n5. Testing Practice Mode...');
      await page.locator('#btn-practice').click();
      await page.waitForTimeout(3000);
      
      const questions = await page.locator('.question-card').all();
      console.log(`   - Questions loaded: ${questions.length}`);
      
      if (questions.length > 0) {
        // Answer questions
        for (let i = 0; i < Math.min(3, questions.length); i++) {
          await page.locator(`input[name="q_${i}"]`).first().click();
        }
        
        await page.screenshot({ path: 'quiz_practice_new.png' });
        console.log('   Screenshot: quiz_practice_new.png');
      }
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'quiz_error_new.png' });
  } finally {
    console.log('\nKeeping browser open for inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testNewQuiz();