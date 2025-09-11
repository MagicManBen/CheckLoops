import { chromium } from 'playwright';

async function testQuizRestriction() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen to console logs to monitor the quiz restriction logic
  page.on('console', msg => {
    if (msg.text().includes('📅') || msg.text().includes('🎯')) {
      console.log('Browser Console:', msg.text());
    }
  });
  
  try {
    console.log('🧪 Starting quiz restriction test...');
    
    // Navigate to home page first
    console.log('🧪 Navigating to home page...');
    await page.goto('http://127.0.0.1:5500/home.html');
    
    // Login with test credentials
    console.log('🧪 Logging in...');
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Navigate to quiz page
    console.log('🧪 Navigating to quiz page...');
    await page.goto('http://127.0.0.1:5500/staff-quiz.html');
    await page.waitForTimeout(2000);
    
    // Take a screenshot of the initial state
    await page.screenshot({ path: 'quiz_initial_state.png' });
    console.log('🧪 Screenshot saved: quiz_initial_state.png');
    
    // Check if Required Quiz button is enabled or disabled
    const requiredButton = page.locator('#btn-required');
    const isDisabled = await requiredButton.isDisabled();
    console.log('🧪 Required quiz button disabled:', isDisabled);
    
    if (!isDisabled) {
      console.log('🧪 Attempting to start required quiz (first time)...');
      
      // Click the required quiz button
      await requiredButton.click();
      await page.waitForTimeout(3000); // Give more time for quiz to start
      
      // Check if quiz started (should show quiz-active panel)
      const quizActive = page.locator('#quiz-active');
      // Wait for the element to potentially become visible
      try {
        await quizActive.waitFor({ state: 'visible', timeout: 5000 });
      } catch (e) {
        console.log('🧪 Quiz active panel not visible within 5 seconds');
      }
      const isVisible = await quizActive.isVisible();
      console.log('🧪 Quiz started successfully:', isVisible);
      
      if (isVisible) {
        console.log('🧪 Taking screenshot of active quiz...');
        await page.screenshot({ path: 'quiz_active_first_attempt.png' });
        
        // Fill out the quiz quickly to complete it
        console.log('🧪 Filling out quiz answers...');
        
        // Answer all questions (select first option for each)
        const radioButtons = await page.locator('input[type="radio"]').all();
        for (let i = 0; i < Math.min(radioButtons.length, 10); i++) {
          const name = await radioButtons[i].getAttribute('name');
          if (name && name.startsWith('q_')) {
            await radioButtons[i].click();
            await page.waitForTimeout(100);
          }
        }
        
        // Submit the quiz
        console.log('🧪 Submitting quiz...');
        await page.click('#btn-submit');
        await page.waitForTimeout(5000); // Wait for submission to complete
        
        // Take screenshot of results
        await page.screenshot({ path: 'quiz_results_first_attempt.png' });
        console.log('🧪 Screenshot saved: quiz_results_first_attempt.png');
        
        // Return to quiz home
        console.log('🧪 Returning to quiz home...');
        await page.click('#btn-home');
        await page.waitForTimeout(2000);
        
        // Take screenshot of home after completion
        await page.screenshot({ path: 'quiz_home_after_completion.png' });
        console.log('🧪 Screenshot saved: quiz_home_after_completion.png');
        
        // Now try to take the required quiz again (this should be blocked)
        console.log('🧪 Attempting to start required quiz (second time - should be blocked)...');
        
        const requiredButtonAfter = page.locator('#btn-required');
        const isDisabledAfter = await requiredButtonAfter.isDisabled();
        console.log('🧪 Required quiz button disabled after completion:', isDisabledAfter);
        
        if (!isDisabledAfter) {
          console.log('🧪 ERROR: Button should be disabled but is still enabled!');
          
          // Try clicking it anyway to see if the restriction works at the function level
          await requiredButtonAfter.click();
          await page.waitForTimeout(2000);
          
          // Check if an alert appeared or quiz was blocked
          const quizActiveAfter = page.locator('#quiz-active');
          const isVisibleAfter = await quizActiveAfter.isVisible();
          console.log('🧪 Quiz started on second attempt (should be false):', isVisibleAfter);
          
          if (isVisibleAfter) {
            console.log('🧪 ❌ FAILURE: Quiz restriction is not working - quiz started again!');
          } else {
            console.log('🧪 ✅ SUCCESS: Quiz restriction working - quiz was blocked!');
          }
        } else {
          console.log('🧪 ✅ SUCCESS: Quiz button correctly disabled after completion!');
        }
        
        // Final screenshot
        await page.screenshot({ path: 'quiz_final_state.png' });
        console.log('🧪 Screenshot saved: quiz_final_state.png');
      }
    } else {
      console.log('🧪 Required quiz button is already disabled - quiz was likely taken this week already');
    }
    
  } catch (error) {
    console.error('🧪 Test failed:', error);
    await page.screenshot({ path: 'quiz_test_error.png' });
  } finally {
    await browser.close();
    console.log('🧪 Test completed');
  }
}

testQuizRestriction();