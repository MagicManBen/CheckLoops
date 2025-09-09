import { chromium } from 'playwright';

async function testFinalQuizFunctionality() {
  console.log('🎯 Final Quiz Functionality Test');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
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
    
    // Check required quiz status
    const requiredStatus = await page.locator('#required-status').innerHTML();
    const requiredBtn = page.locator('#btn-required');
    const isEnabled = await requiredBtn.isEnabled();
    const buttonText = await requiredBtn.textContent();
    
    console.log('📝 Required Quiz Status:');
    console.log(`  Button enabled: ${isEnabled}`);
    console.log(`  Button text: "${buttonText.trim()}"`);
    console.log(`  Status HTML contains countdown: ${requiredStatus.includes('countdown-display')}`);
    
    // Test practice quiz (should always work)
    console.log('🎯 Step 3: Test Practice Quiz');
    await page.click('#btn-practice');
    await page.waitForTimeout(2000);
    
    const practiceQuestionCount = await page.locator('.question-card').count();
    console.log(`  Practice quiz questions: ${practiceQuestionCount}`);
    
    if (practiceQuestionCount > 0) {
      // Answer and submit
      for (let i = 0; i < practiceQuestionCount; i++) {
        await page.locator('.question-card').nth(i).locator('input[type="radio"]').first().click();
        await page.waitForTimeout(200);
      }
      
      await page.click('#btn-submit');
      await page.waitForTimeout(3000);
      
      const resultsVisible = await page.locator('#quiz-results').isVisible();
      console.log(`  Practice results visible: ${resultsVisible}`);
      
      if (resultsVisible) {
        const scoreText = await page.locator('#score-display').textContent();
        console.log(`  Practice score: ${scoreText}`);
      }
      
      // Go back home
      await page.click('#btn-home');
      await page.waitForTimeout(3000);
    }
    
    // Final screenshot
    await page.screenshot({ path: 'test_final_quiz.png', fullPage: true });
    
    console.log('✅ Final quiz test completed successfully!');
    
  } catch (error) {
    console.error('❌ Final quiz test failed:', error);
    await page.screenshot({ path: 'test_final_quiz_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testFinalQuizFunctionality();