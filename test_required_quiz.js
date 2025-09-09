import { chromium } from 'playwright';

async function testRequiredQuiz() {
  console.log('📝 Testing Required Quiz Functionality');
  
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
    
    // Check required quiz button status
    const requiredBtn = page.locator('#btn-required');
    const isEnabled = await requiredBtn.isEnabled();
    const buttonText = await requiredBtn.textContent();
    
    console.log(`Required button enabled: ${isEnabled}`);
    console.log(`Required button text: "${buttonText}"`);
    
    if (isEnabled && !buttonText.includes('Completed')) {
      console.log('📝 Step 3: Start Required Quiz');
      await requiredBtn.click();
      await page.waitForTimeout(2000);
      
      // Verify questions loaded
      const questionCount = await page.locator('.question-card').count();
      console.log(`✅ Found ${questionCount} quiz questions for required quiz`);
      
      // Check mode badge
      const modeBadge = await page.locator('#mode-badge').textContent();
      console.log(`Mode badge: "${modeBadge}"`);
      
      // Take screenshot
      await page.screenshot({ path: 'required_quiz_test.png', fullPage: true });
      
      console.log('✅ Required quiz started successfully');
    } else {
      console.log('ℹ️ Required quiz already completed this week or disabled');
      
      // Take screenshot of status
      await page.screenshot({ path: 'required_quiz_completed.png', fullPage: true });
    }
    
  } catch (error) {
    console.error('❌ Required quiz test failed:', error);
    await page.screenshot({ path: 'required_quiz_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testRequiredQuiz();