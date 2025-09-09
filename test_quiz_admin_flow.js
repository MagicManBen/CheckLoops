import { chromium } from 'playwright';

async function testQuizAdminFlow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('1. Navigating to index page...');
    await page.goto('http://127.0.0.1:58156/index.html');
    await page.waitForTimeout(2000);
    
    // Check if we were redirected
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    // Login with admin account
    console.log('2. Logging in with admin account...');
    // Try to find the email field - it might be on a different page
    try {
      await page.locator('#email').fill('benhowardmagic@hotmail.com');
      await page.locator('#password').fill('Hello1!');
      await page.click('button:has-text("Sign In")');
    } catch (e) {
      // If login fields not found, we might already be logged in or on wrong page
      console.log('   Login fields not found, checking for logged-in state...');
      // Try navigating directly to staff page
      await page.goto('http://127.0.0.1:58156/staff.html');
    }
    await page.waitForTimeout(3000);
    
    // Take screenshot of logged in state
    await page.screenshot({ path: 'test_1_admin_logged_in.png' });
    console.log('   Screenshot saved: test_1_admin_logged_in.png');
    
    // First check the admin panel to see current quiz data
    console.log('3. Checking admin panel for quiz data...');
    const adminButton = await page.locator('button:has-text("Admin Site")');
    if (await adminButton.isVisible()) {
      await adminButton.click();
      await page.waitForTimeout(2000);
      
      // Look for quiz_attempts in admin
      const quizAttemptsTab = await page.locator('button:has-text("quiz_attempts")');
      if (await quizAttemptsTab.isVisible()) {
        await quizAttemptsTab.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test_admin_quiz_attempts.png' });
        console.log('   Screenshot saved: test_admin_quiz_attempts.png');
      }
      
      // Check profiles for next_quiz_due
      const profilesTab = await page.locator('button:has-text("profiles")');
      if (await profilesTab.isVisible()) {
        await profilesTab.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test_admin_profiles.png' });
        console.log('   Screenshot saved: test_admin_profiles.png');
      }
    }
    
    // Navigate to staff page
    console.log('4. Navigating to staff page...');
    await page.goto('http://127.0.0.1:58156/staff.html');
    await page.waitForTimeout(2000);
    
    // Click on Quiz section
    console.log('5. Clicking on Quiz section...');
    await page.click('button[data-section="quiz"]');
    await page.waitForTimeout(3000);
    
    // Take screenshot of quiz page
    await page.screenshot({ path: 'test_2_quiz_page.png' });
    console.log('   Screenshot saved: test_2_quiz_page.png');
    
    // Check if quiz is due or countdown is shown
    const countdownVisible = await page.locator('#countdown-wrap').isVisible();
    const practiceButtonVisible = await page.locator('#start-practice').isVisible();
    const requiredButtonVisible = await page.locator('#start-required').isVisible();
    
    console.log('6. Quiz state:');
    console.log('   - Countdown visible:', countdownVisible);
    console.log('   - Practice button visible:', practiceButtonVisible);
    console.log('   - Required button visible:', requiredButtonVisible);
    
    // Get the countdown text if visible
    if (countdownVisible) {
      const countdownText = await page.locator('#countdown').textContent();
      console.log('   - Countdown text:', countdownText);
      
      // Check for quiz due banner
      const bannerVisible = await page.locator('#quiz-due-banner').isVisible();
      if (bannerVisible) {
        const bannerText = await page.locator('#quiz-due-banner .countdown').textContent();
        console.log('   - Banner countdown:', bannerText);
      }
    }
    
    // Test practice quiz first
    if (practiceButtonVisible) {
      console.log('7. Starting PRACTICE quiz...');
      await page.click('#start-practice');
      await page.waitForTimeout(2000);
      
      // Check quiz description
      const descText = await page.locator('#quiz-description').textContent();
      console.log('   - Quiz description:', descText);
      
      // Check if questions loaded
      const questions = await page.locator('.quiz-question').all();
      console.log(`   - Found ${questions.length} questions`);
      
      if (questions.length > 0) {
        // Answer all questions
        console.log('8. Answering all questions...');
        for (let i = 0; i < questions.length; i++) {
          // Select first option for each question
          const firstOption = await page.locator(`input[name="q_${i}"]`).first();
          if (await firstOption.isVisible()) {
            await firstOption.click();
            console.log(`   - Answered question ${i + 1}`);
          }
        }
        
        // Check progress bar
        const progressWidth = await page.locator('#prog').evaluate(el => el.style.width);
        console.log('   - Progress bar:', progressWidth);
        
        // Take screenshot of completed quiz
        await page.screenshot({ path: 'test_3_practice_complete.png' });
        console.log('   Screenshot saved: test_3_practice_complete.png');
        
        // Submit quiz
        console.log('9. Submitting practice quiz...');
        const submitButton = await page.locator('#submit-quiz');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(3000);
          
          // Take screenshot of results
          await page.screenshot({ path: 'test_4_practice_results.png' });
          console.log('   Screenshot saved: test_4_practice_results.png');
          
          // Check result
          const resultVisible = await page.locator('#quiz-result').isVisible();
          if (resultVisible) {
            const resultText = await page.locator('#quiz-result').textContent();
            console.log('   - Result:', resultText);
          }
        }
        
        // Reload to test required quiz
        console.log('10. Reloading page to test required quiz...');
        await page.reload();
        await page.waitForTimeout(2000);
      }
    }
    
    // Now test required quiz if available
    const requiredAvailable = await page.locator('#start-required').isVisible();
    if (requiredAvailable) {
      console.log('11. Starting REQUIRED quiz...');
      await page.click('#start-required');
      await page.waitForTimeout(2000);
      
      // Check quiz description
      const descText = await page.locator('#quiz-description').textContent();
      console.log('   - Quiz description:', descText);
      
      // Answer all questions
      const questions = await page.locator('.quiz-question').all();
      console.log(`   - Found ${questions.length} questions`);
      
      for (let i = 0; i < questions.length; i++) {
        const firstOption = await page.locator(`input[name="q_${i}"]`).first();
        if (await firstOption.isVisible()) {
          await firstOption.click();
        }
      }
      
      await page.screenshot({ path: 'test_5_required_complete.png' });
      console.log('   Screenshot saved: test_5_required_complete.png');
      
      // Submit required quiz
      console.log('12. Submitting required quiz...');
      await page.click('#submit-quiz');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test_6_required_results.png' });
      console.log('   Screenshot saved: test_6_required_results.png');
      
      // Check result
      const resultText = await page.locator('#quiz-result').textContent();
      console.log('   - Result:', resultText);
    }
    
    // Go back to admin panel to verify the submission
    console.log('13. Checking admin panel for new quiz attempt...');
    await page.goto('http://127.0.0.1:58156/index.html');
    await page.waitForTimeout(2000);
    
    const adminBtn = await page.locator('button:has-text("Admin Site")');
    if (await adminBtn.isVisible()) {
      await adminBtn.click();
      await page.waitForTimeout(2000);
      
      // Check quiz_attempts table
      const quizTab = await page.locator('button:has-text("quiz_attempts")');
      if (await quizTab.isVisible()) {
        await quizTab.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test_admin_final_attempts.png' });
        console.log('   Screenshot saved: test_admin_final_attempts.png');
      }
      
      // Check profiles for updated next_quiz_due
      const profTab = await page.locator('button:has-text("profiles")');
      if (await profTab.isVisible()) {
        await profTab.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test_admin_final_profiles.png' });
        console.log('   Screenshot saved: test_admin_final_profiles.png');
      }
    }
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test_error.png' });
    console.log('   Error screenshot saved: test_error.png');
  } finally {
    await browser.close();
  }
}

testQuizAdminFlow();