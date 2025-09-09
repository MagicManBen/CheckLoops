import { chromium } from 'playwright';

async function testQuizDirect() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Go directly to test quiz page
    console.log('1. Navigating to test quiz page...');
    await page.goto('http://127.0.0.1:58156/staff-quiz-test.html');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test_quiz_direct_1.png' });
    console.log('   Screenshot: test_quiz_direct_1.png');
    
    // Check what's visible
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    // Look for quiz UI elements
    const welcomeBanner = await page.locator('.welcome-banner').count();
    const modeCards = await page.locator('.mode-card').count();
    const practiceBtn = await page.locator('#btn-practice').count();
    const requiredBtn = await page.locator('#btn-required').count();
    
    console.log('\n2. Quiz page elements:');
    console.log('   - Welcome banner:', welcomeBanner > 0 ? '✓' : '✗');
    console.log('   - Mode cards:', modeCards);
    console.log('   - Practice button:', practiceBtn > 0 ? '✓' : '✗');
    console.log('   - Required button:', requiredBtn > 0 ? '✓' : '✗');
    
    if (practiceBtn > 0) {
      console.log('\n3. Testing Practice Mode...');
      await page.locator('#btn-practice').click();
      await page.waitForTimeout(3000);
      
      const quizActive = await page.locator('#quiz-active').isVisible();
      const questions = await page.locator('.question-card').count();
      
      console.log('   - Quiz active:', quizActive);
      console.log('   - Questions loaded:', questions);
      
      if (questions > 0) {
        console.log('   ✓ Practice quiz loaded successfully!');
        
        // Answer all questions
        for (let i = 0; i < questions; i++) {
          const firstOption = await page.locator(`input[name="q_${i}"]`).first();
          if (await firstOption.count() > 0) {
            await firstOption.click();
          }
        }
        
        await page.screenshot({ path: 'test_quiz_direct_2.png' });
        console.log('   Screenshot: test_quiz_direct_2.png');
        
        // Submit
        const submitBtn = await page.locator('#btn-submit');
        if (await submitBtn.isEnabled()) {
          console.log('   - Submitting quiz...');
          await submitBtn.click();
          await page.waitForTimeout(3000);
          
          const resultsVisible = await page.locator('#quiz-results').isVisible();
          if (resultsVisible) {
            const score = await page.locator('#score-display').textContent();
            const message = await page.locator('#score-message').textContent();
            console.log('   - Score:', score);
            console.log('   - Message:', message);
            
            await page.screenshot({ path: 'test_quiz_direct_3.png' });
            console.log('   Screenshot: test_quiz_direct_3.png');
          }
        }
      }
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'test_error_direct.png' });
  } finally {
    console.log('\nKeeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testQuizDirect();