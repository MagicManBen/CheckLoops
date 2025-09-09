import { chromium } from 'playwright';

async function testQuizDirect() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Go directly to staff-quiz.html
    console.log('1. Navigating directly to staff-quiz.html...');
    await page.goto('http://127.0.0.1:58156/staff-quiz.html');
    await page.waitForTimeout(3000);
    
    // Take screenshot to see what's on the page
    await page.screenshot({ path: 'test_quiz_direct_1.png' });
    console.log('   Screenshot saved: test_quiz_direct_1.png');
    
    // Check if we need to login
    const emailField = await page.locator('#email');
    if (await emailField.isVisible()) {
      console.log('2. Login required. Logging in...');
      await emailField.fill('benhowardmagic@hotmail.com');
      await page.locator('#password').fill('Hello1!');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
      
      // Navigate back to quiz page after login
      await page.goto('http://127.0.0.1:58156/staff-quiz.html');
      await page.waitForTimeout(3000);
    }
    
    // Take screenshot of quiz page
    await page.screenshot({ path: 'test_quiz_direct_2.png' });
    console.log('   Screenshot saved: test_quiz_direct_2.png');
    
    // Check what elements are visible
    console.log('3. Checking page elements...');
    
    // Check for countdown
    const countdownWrap = await page.locator('#countdown-wrap');
    if (await countdownWrap.count() > 0) {
      const isVisible = await countdownWrap.isVisible();
      console.log('   - Countdown wrap exists and visible:', isVisible);
      if (isVisible) {
        const countdownText = await page.locator('#countdown').textContent();
        console.log('   - Countdown text:', countdownText);
      }
    } else {
      console.log('   - No countdown wrap found');
    }
    
    // Check for practice button
    const practiceBtn = await page.locator('#start-practice');
    if (await practiceBtn.count() > 0) {
      const isVisible = await practiceBtn.isVisible();
      console.log('   - Practice button exists and visible:', isVisible);
    } else {
      console.log('   - No practice button found');
    }
    
    // Check for required button
    const requiredBtn = await page.locator('#start-required');
    if (await requiredBtn.count() > 0) {
      const isVisible = await requiredBtn.isVisible();
      console.log('   - Required button exists and visible:', isVisible);
    } else {
      console.log('   - No required button found');
    }
    
    // Check for quiz container
    const quizContainer = await page.locator('#quiz-container');
    if (await quizContainer.count() > 0) {
      console.log('   - Quiz container exists');
      const questions = await page.locator('.quiz-question').all();
      console.log(`   - Questions in container: ${questions.length}`);
    } else {
      console.log('   - No quiz container found');
    }
    
    // Check for any error messages
    const errorMessages = await page.locator('.error, .alert').all();
    if (errorMessages.length > 0) {
      console.log('   - Error messages found:', errorMessages.length);
      for (const msg of errorMessages) {
        const text = await msg.textContent();
        console.log('     -', text);
      }
    }
    
    // Try to start a practice quiz if button is visible
    if (await practiceBtn.count() > 0 && await practiceBtn.isVisible()) {
      console.log('4. Starting practice quiz...');
      await practiceBtn.click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test_quiz_practice.png' });
      console.log('   Screenshot saved: test_quiz_practice.png');
      
      // Check if questions loaded
      const questions = await page.locator('.quiz-question').all();
      console.log(`   - Questions loaded: ${questions.length}`);
      
      if (questions.length > 0) {
        // Answer first few questions
        for (let i = 0; i < Math.min(3, questions.length); i++) {
          const firstOption = await page.locator(`input[name="q_${i}"]`).first();
          if (await firstOption.isVisible()) {
            await firstOption.click();
            console.log(`   - Answered question ${i + 1}`);
          }
        }
        
        // Check progress
        const progress = await page.locator('#prog');
        if (await progress.count() > 0) {
          const width = await progress.evaluate(el => el.style.width);
          console.log('   - Progress bar:', width);
        }
        
        await page.screenshot({ path: 'test_quiz_progress.png' });
        console.log('   Screenshot saved: test_quiz_progress.png');
      }
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test_error.png' });
    console.log('   Error screenshot saved: test_error.png');
    
    // Try to get console logs
    page.on('console', msg => console.log('Browser console:', msg.text()));
    
  } finally {
    // Keep browser open for inspection
    console.log('\nKeeping browser open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testQuizDirect();