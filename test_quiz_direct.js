import { chromium } from 'playwright';

async function testQuizDirect() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen to console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('📅') || text.includes('🎯') || text.includes('💾')) {
      console.log('Browser:', text);
    }
  });
  
  try {
    console.log('🧪 Step 1: Navigate directly to staff-quiz.html as logged in user');
    
    // First login via home page
    await page.goto('http://127.0.0.1:5500/home.html');
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Now navigate directly to quiz page
    console.log('🧪 Step 2: Navigate directly to quiz page');
    await page.goto('http://127.0.0.1:5500/staff-quiz.html');
    await page.waitForTimeout(2000);
    
    console.log('🧪 Step 3: Check Required Quiz button state');
    const btnRequired = page.locator('#btn-required');
    let isDisabled = await btnRequired.isDisabled();
    let buttonText = await btnRequired.textContent();
    console.log('🧪 Button disabled:', isDisabled);
    console.log('🧪 Button text:', buttonText.trim());
    
    if (!isDisabled) {
      console.log('🧪 Step 4: Click Required Quiz button');
      await btnRequired.click();
      
      // Don't wait for navigation, just wait a bit
      await page.waitForTimeout(3000);
      
      // Check what's visible now
      const quizHome = await page.locator('#quiz-home').isVisible();
      const quizActive = await page.locator('#quiz-active').isVisible();
      const quizResults = await page.locator('#quiz-results').isVisible();
      
      console.log('🧪 Visibility - Home:', quizHome, 'Active:', quizActive, 'Results:', quizResults);
      
      if (quizActive) {
        console.log('🧪 ✅ Quiz panel is now active!');
        
        // Answer questions
        console.log('🧪 Step 5: Answering questions');
        for (let i = 0; i < 10; i++) {
          try {
            await page.locator(`input[name="q_${i}"][value="0"]`).click();
          } catch (e) {
            // Some questions might not exist
          }
        }
        
        // Submit
        console.log('🧪 Step 6: Submit quiz');
        const submitBtn = page.locator('#btn-submit');
        // Wait for button to be enabled (all questions answered)
        await page.waitForTimeout(1000);
        await submitBtn.click();
        
        // Wait for results
        await page.waitForTimeout(3000);
        
        // Go back to home
        console.log('🧪 Step 7: Back to quiz home');
        await page.click('#btn-home');
        await page.waitForTimeout(2000);
        
        // Check button state again
        console.log('🧪 Step 8: Check if button is disabled now');
        isDisabled = await btnRequired.isDisabled();
        buttonText = await btnRequired.textContent();
        console.log('🧪 After quiz - Button disabled:', isDisabled);
        console.log('🧪 After quiz - Button text:', buttonText.trim());
        
        if (!isDisabled) {
          console.log('🧪 ❌ BUG: Button still enabled!');
          
          // Try clicking again
          await btnRequired.click();
          await page.waitForTimeout(2000);
          
          // Check for alert or quiz start
          const quizActiveAgain = await page.locator('#quiz-active').isVisible();
          console.log('🧪 Quiz started again?', quizActiveAgain);
        } else {
          console.log('🧪 ✅ SUCCESS: Button is disabled!');
        }
      } else {
        console.log('🧪 ❌ Quiz panel did not become active');
        await page.screenshot({ path: 'quiz_not_active.png' });
      }
    } else {
      console.log('🧪 Button was already disabled');
    }
    
  } catch (error) {
    console.error('🧪 Test error:', error);
    await page.screenshot({ path: 'test_error.png' });
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
    console.log('🧪 Test complete');
  }
}

testQuizDirect();