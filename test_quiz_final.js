import { chromium } from 'playwright';

async function testQuizFunctionality() {
  console.log('🧪 Testing Quiz Page Final Fixes');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const page = await browser.newPage();
  
  try {
    // Login and navigate to quiz
    console.log('📝 Step 1: Login');
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Take screenshot after login
    await page.screenshot({ path: 'test_1_after_login.png', fullPage: true });
    
    console.log('🧠 Step 2: Navigate to Quiz page');
    await page.click('a[href="staff-quiz.html"]');
    await page.waitForTimeout(3000);
    
    // Take screenshot of quiz home page with new theme
    await page.screenshot({ path: 'test_2_quiz_home_themed.png', fullPage: true });
    
    console.log('🎯 Step 3: Test Practice Quiz button');
    const practiceBtn = page.locator('#btn-practice');
    await practiceBtn.waitFor({ state: 'visible' });
    console.log('Practice button visible:', await practiceBtn.isVisible());
    console.log('Practice button enabled:', await practiceBtn.isEnabled());
    
    await practiceBtn.click();
    await page.waitForTimeout(2000);
    
    // Take screenshot of quiz in progress
    await page.screenshot({ path: 'test_3_practice_quiz_started.png', fullPage: true });
    
    // Verify quiz questions are visible
    const questionsVisible = await page.locator('.question-card').first().isVisible();
    console.log('Quiz questions visible:', questionsVisible);
    
    // Go back to home and test required quiz
    console.log('📝 Step 4: Test Required Quiz button');
    await page.reload();
    await page.waitForTimeout(3000);
    
    const requiredBtn = page.locator('#btn-required');
    await requiredBtn.waitFor({ state: 'visible' });
    console.log('Required button visible:', await requiredBtn.isVisible());
    console.log('Required button enabled:', await requiredBtn.isEnabled());
    
    if (await requiredBtn.isEnabled()) {
      await requiredBtn.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot of required quiz started
      await page.screenshot({ path: 'test_4_required_quiz_started.png', fullPage: true });
    }
    
    console.log('✅ Quiz functionality test complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test_error_quiz.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testQuizFunctionality();