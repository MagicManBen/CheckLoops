import { chromium } from 'playwright';

async function testCompleteQuizFlow() {
  console.log('🎯 Testing Complete Quiz Flow');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const page = await browser.newPage();
  
  try {
    // Login
    console.log('🔑 Step 1: Login');
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Navigate to quiz
    console.log('🧠 Step 2: Navigate to Quiz page');
    await page.click('a[href="staff-quiz.html"]');
    await page.waitForTimeout(3000);
    
    // Take screenshot of quiz home
    await page.screenshot({ path: 'quiz_flow_1_home.png', fullPage: true });
    
    // Start practice quiz
    console.log('🎯 Step 3: Start Practice Quiz');
    await page.click('#btn-practice');
    await page.waitForTimeout(2000);
    
    // Take screenshot of quiz in progress
    await page.screenshot({ path: 'quiz_flow_2_questions.png', fullPage: true });
    
    // Verify questions are visible
    const questionCount = await page.locator('.question-card').count();
    console.log(`✅ Found ${questionCount} quiz questions`);
    
    if (questionCount > 0) {
      // Answer first few questions
      console.log('📝 Step 4: Answer questions');
      
      // Answer first question (click first option)
      await page.locator('.question-card').first().locator('input[type="radio"]').first().click();
      await page.waitForTimeout(500);
      
      // Answer second question (click second option)
      await page.locator('.question-card').nth(1).locator('input[type="radio"]').nth(1).click();
      await page.waitForTimeout(500);
      
      // Answer remaining questions quickly
      for (let i = 2; i < Math.min(questionCount, 10); i++) {
        await page.locator('.question-card').nth(i).locator('input[type="radio"]').first().click();
        await page.waitForTimeout(300);
      }
      
      // Take screenshot after answering
      await page.screenshot({ path: 'quiz_flow_3_answered.png', fullPage: true });
      
      // Submit quiz
      console.log('📤 Step 5: Submit Quiz');
      const submitBtn = page.locator('#btn-submit');
      const isEnabled = await submitBtn.isEnabled();
      console.log(`Submit button enabled: ${isEnabled}`);
      
      if (isEnabled) {
        await submitBtn.click();
        await page.waitForTimeout(5000); // Wait for processing and results
        
        // Take screenshot of results
        await page.screenshot({ path: 'quiz_flow_4_results.png', fullPage: true });
        
        // Check if results are visible
        const resultsVisible = await page.locator('#quiz-results').isVisible();
        console.log(`Results visible: ${resultsVisible}`);
        
        if (resultsVisible) {
          // Get score
          const scoreText = await page.locator('#score-display').textContent();
          console.log(`✅ Quiz completed! Score: ${scoreText}`);
          
          // Test home button
          console.log('🏠 Step 6: Test Home Button');
          await page.click('#btn-home');
          await page.waitForTimeout(2000);
          
          // Verify we're back at home
          const homeVisible = await page.locator('#quiz-home').isVisible();
          console.log(`Back at home: ${homeVisible}`);
          
          await page.screenshot({ path: 'quiz_flow_5_back_home.png', fullPage: true });
        }
      }
    }
    
    console.log('✅ Complete quiz flow test finished successfully!');
    
  } catch (error) {
    console.error('❌ Quiz flow test failed:', error);
    await page.screenshot({ path: 'quiz_flow_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testCompleteQuizFlow();