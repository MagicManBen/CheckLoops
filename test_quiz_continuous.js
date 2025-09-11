import { chromium } from 'playwright';

async function testQuizContinuous() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    console.log('Browser Console:', msg.text());
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
    
    console.log('🧪 Step 3: Click Quiz button');
    // Try different ways to find the Quiz button
    const quizButton = page.locator('button[data-section="quiz"]').or(page.locator('button:has-text("Quiz")'));
    await quizButton.click();
    await page.waitForTimeout(2000);
    
    console.log('🧪 Step 4: Start Required Quiz (first attempt)');
    await page.screenshot({ path: 'before_first_quiz.png' });
    await page.click('#btn-required');
    await page.waitForTimeout(3000);
    
    console.log('🧪 Step 5: Tick all quiz boxes');
    // Select all radio buttons (first option for each question)
    for (let i = 0; i < 10; i++) {
      const selector = `input[name="q_${i}"][value="0"]`;
      const radio = page.locator(selector);
      if (await radio.count() > 0) {
        await radio.click();
        await page.waitForTimeout(100);
      }
    }
    
    console.log('🧪 Step 6: Submit quiz');
    await page.click('#btn-submit');
    await page.waitForTimeout(5000); // Wait for submission to complete
    
    console.log('🧪 Step 7: Back to quiz home');
    await page.click('#btn-home');
    await page.waitForTimeout(2000);
    
    console.log('🧪 Step 8: Check if Required Quiz button is still enabled');
    await page.screenshot({ path: 'after_first_quiz.png' });
    const requiredButton = page.locator('#btn-required');
    const isDisabled = await requiredButton.isDisabled();
    const buttonText = await requiredButton.textContent();
    
    console.log('🧪 Required button disabled:', isDisabled);
    console.log('🧪 Required button text:', buttonText);
    
    if (!isDisabled) {
      console.log('🧪 ❌ BUG CONFIRMED: Button is still enabled! Trying to start quiz again...');
      
      console.log('🧪 Step 9: Attempting second quiz (should be blocked)');
      await requiredButton.click();
      await page.waitForTimeout(2000);
      
      // Check if quiz started
      const quizActive = page.locator('#quiz-active');
      const isVisible = await quizActive.isVisible();
      
      if (isVisible) {
        console.log('🧪 ❌ CRITICAL BUG: Quiz started again! Taking screenshot...');
        await page.screenshot({ path: 'second_quiz_started.png' });
      } else {
        console.log('🧪 ✅ Good: Quiz was blocked on second attempt');
      }
    } else {
      console.log('🧪 ✅ SUCCESS: Button is correctly disabled after first quiz');
    }
    
  } catch (error) {
    console.error('🧪 Test failed:', error);
    await page.screenshot({ path: 'error_screenshot.png' });
  } finally {
    await browser.close();
    console.log('🧪 Test completed');
  }
}

testQuizContinuous();