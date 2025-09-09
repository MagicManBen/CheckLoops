import { chromium } from 'playwright';

async function testQuizFlow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // First login through index.html
    console.log('1. Navigating to login page (index.html)...');
    await page.goto('http://127.0.0.1:58156/index.html');
    await page.waitForTimeout(2000);
    
    // Login
    console.log('2. Logging in...');
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Try navigating to staff.html first
    console.log('3. Navigating to staff.html...');
    await page.goto('http://127.0.0.1:58156/staff.html');
    await page.waitForTimeout(3000);
    
    // Check if we need to login again on staff.html
    if (await page.locator('#email').isVisible()) {
      console.log('   Re-authenticating on staff.html...');
      await page.locator('#email').fill('benhowardmagic@hotmail.com');
      await page.locator('#password').fill('Hello1!');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
    }
    
    // Now look for the quiz link or button
    console.log('4. Looking for Quiz option...');
    // Try the quiz alert button first
    const quizAlertBtn = await page.locator('.quiz-alert-btn, a:has-text("Take Quiz")');
    if (await quizAlertBtn.count() > 0) {
      console.log('   Found quiz alert button, clicking...');
      await quizAlertBtn.click();
      await page.waitForTimeout(3000);
    } else {
      // Try navigation button
      const quizNavBtn = await page.locator('button:has-text("Quiz")');
      if (await quizNavBtn.count() > 0) {
        console.log('   Found Quiz nav button, clicking...');
        await quizNavBtn.click();
        await page.waitForTimeout(3000);
      } else {
        // Direct navigation as last resort
        console.log('   No quiz button found, navigating directly...');
        await page.goto('http://127.0.0.1:58156/staff-quiz.html');
        await page.waitForTimeout(3000);
      }
    }
    
    // Check if we're on the quiz page
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    // Look for quiz UI elements
    const welcomeBanner = await page.locator('.welcome-banner').count();
    const modeCards = await page.locator('.mode-card').count();
    
    console.log('5. Quiz page elements:');
    console.log('   - Welcome banner found:', welcomeBanner > 0);
    console.log('   - Mode cards found:', modeCards);
    
    await page.screenshot({ path: 'quiz_after_login.png' });
    console.log('   Screenshot: quiz_after_login.png');
    
    // Try practice quiz if button is available
    const practiceBtn = await page.locator('#btn-practice');
    if (await practiceBtn.count() > 0) {
      console.log('\n6. Starting Practice Quiz...');
      await practiceBtn.click();
      await page.waitForTimeout(3000);
      
      // Check if quiz started
      const quizActive = await page.locator('#quiz-active').isVisible();
      const questions = await page.locator('.question-card').count();
      
      console.log('   - Quiz active:', quizActive);
      console.log('   - Questions loaded:', questions);
      
      if (questions > 0) {
        // Answer all questions
        for (let i = 0; i < questions; i++) {
          const firstOption = await page.locator(`input[name="q_${i}"]`).first();
          if (await firstOption.count() > 0) {
            await firstOption.click();
          }
        }
        
        await page.screenshot({ path: 'quiz_practice_answered.png' });
        console.log('   Screenshot: quiz_practice_answered.png');
        
        // Submit
        const submitBtn = await page.locator('#btn-submit');
        if (await submitBtn.isEnabled()) {
          console.log('   - Submitting quiz...');
          await submitBtn.click();
          await page.waitForTimeout(3000);
          
          // Check results
          const resultsVisible = await page.locator('#quiz-results').isVisible();
          if (resultsVisible) {
            const score = await page.locator('#score-display').textContent();
            console.log('   - Score:', score);
            
            await page.screenshot({ path: 'quiz_practice_result.png' });
            console.log('   Screenshot: quiz_practice_result.png');
          }
        }
      }
    }
    
    // Go back and test required quiz
    console.log('\n7. Testing Required Quiz...');
    await page.reload();
    await page.waitForTimeout(3000);
    
    const requiredBtn = await page.locator('#btn-required');
    if (await requiredBtn.count() > 0 && await requiredBtn.isEnabled()) {
      console.log('   - Required quiz button is available');
      await requiredBtn.click();
      await page.waitForTimeout(3000);
      
      const questions = await page.locator('.question-card').count();
      console.log('   - Questions loaded:', questions);
      
      if (questions > 0) {
        // Answer all questions
        for (let i = 0; i < questions; i++) {
          const firstOption = await page.locator(`input[name="q_${i}"]`).first();
          if (await firstOption.count() > 0) {
            await firstOption.click();
          }
        }
        
        // Submit
        const submitBtn = await page.locator('#btn-submit');
        if (await submitBtn.isEnabled()) {
          await submitBtn.click();
          await page.waitForTimeout(3000);
          
          const score = await page.locator('#score-display').textContent();
          console.log('   - Required quiz score:', score);
          
          await page.screenshot({ path: 'quiz_required_result.png' });
          console.log('   Screenshot: quiz_required_result.png');
        }
      }
    } else if (await requiredBtn.count() > 0 && !(await requiredBtn.isEnabled())) {
      console.log('   - Required quiz already completed this week');
      const countdown = await page.locator('.countdown-display').textContent();
      console.log('   - Next quiz available in:', countdown);
      
      await page.screenshot({ path: 'quiz_already_completed.png' });
      console.log('   Screenshot: quiz_already_completed.png');
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test_error.png' });
    console.log('   Error screenshot: test_error.png');
  } finally {
    console.log('\nKeeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testQuizFlow();