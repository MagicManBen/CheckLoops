import { chromium } from 'playwright';

async function testQuizFixed() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('📅') || text.includes('🎯') || text.includes('💾') || text.includes('🔄')) {
      console.log('Browser:', text);
    }
  });
  
  try {
    console.log('🧪 Step 1: Navigate to home.html');
    await page.goto('http://127.0.0.1:5500/home.html');
    await page.waitForTimeout(1000);
    
    console.log('🧪 Step 2: Login as benhowardmagic@hotmail.com');
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Wait for staff page to load, then navigate to quiz
    console.log('🧪 Step 3: Navigate to Quiz page via button');
    await page.waitForSelector('button[data-section="quiz"]', { timeout: 5000 });
    await page.click('button[data-section="quiz"]');
    await page.waitForTimeout(2000);
    
    console.log('🧪 Step 4: Check initial state of Required Quiz button');
    await page.screenshot({ path: 'quiz_before_attempt.png' });
    const btnRequired = page.locator('#btn-required');
    let isDisabled = await btnRequired.isDisabled();
    console.log('🧪 Initial button state - disabled:', isDisabled);
    
    if (!isDisabled) {
      console.log('🧪 Step 5: Start Required Quiz');
      await btnRequired.click();
      
      // Wait for quiz to load
      await page.waitForSelector('#quiz-active:visible', { timeout: 5000 });
      console.log('🧪 Quiz started successfully');
      
      console.log('🧪 Step 6: Answer all questions');
      // Answer each question (select first option)
      for (let i = 0; i < 10; i++) {
        const radio = page.locator(`input[name="q_${i}"][value="0"]`);
        if (await radio.count() > 0) {
          await radio.click();
          await page.waitForTimeout(100);
        }
      }
      
      console.log('🧪 Step 7: Submit quiz');
      await page.click('#btn-submit:enabled');
      
      // Wait for results to show
      await page.waitForSelector('#quiz-results:visible', { timeout: 5000 });
      console.log('🧪 Quiz submitted, results shown');
      await page.screenshot({ path: 'quiz_results.png' });
      
      console.log('🧪 Step 8: Return to quiz home');
      await page.click('#btn-home');
      
      // Wait for home to show and status to update
      await page.waitForSelector('#quiz-home:visible', { timeout: 5000 });
      await page.waitForTimeout(2000); // Give time for status update
      
      console.log('🧪 Step 9: Check if Required Quiz button is now disabled');
      await page.screenshot({ path: 'quiz_after_attempt.png' });
      
      const btnRequiredAfter = page.locator('#btn-required');
      isDisabled = await btnRequiredAfter.isDisabled();
      const buttonText = await btnRequiredAfter.textContent();
      
      console.log('🧪 After completion - button disabled:', isDisabled);
      console.log('🧪 After completion - button text:', buttonText.trim());
      
      if (!isDisabled) {
        console.log('🧪 ❌ BUG STILL EXISTS: Button is still enabled after completion!');
        
        // Try clicking it again
        console.log('🧪 Step 10: Attempting to start quiz again (should be blocked)');
        await btnRequiredAfter.click();
        await page.waitForTimeout(2000);
        
        // Check if alert appeared or quiz started
        const quizActiveAgain = await page.locator('#quiz-active').isVisible();
        if (quizActiveAgain) {
          console.log('🧪 ❌ CRITICAL: Quiz started again! Restriction not working!');
          await page.screenshot({ path: 'quiz_started_again.png' });
        } else {
          console.log('🧪 ✅ Quiz was blocked on second attempt (alert shown)');
        }
      } else {
        console.log('🧪 ✅ SUCCESS: Button is correctly disabled after quiz completion!');
      }
    } else {
      console.log('🧪 Quiz button was already disabled - quiz was likely taken this week already');
    }
    
  } catch (error) {
    console.error('🧪 Test failed:', error);
    await page.screenshot({ path: 'test_error.png' });
  } finally {
    await page.waitForTimeout(3000); // Keep browser open briefly to observe
    await browser.close();
    console.log('🧪 Test completed');
  }
}

testQuizFixed();