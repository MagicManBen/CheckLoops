import { chromium } from 'playwright';

async function testQuizDatabase() {
  console.log('🗄️ Testing Quiz Database Functionality');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const page = await browser.newPage();
  
  // Capture database-related console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (text.includes('💾') || text.includes('submitQuiz') || text.includes('Error')) {
      console.log(`BROWSER ${type.toUpperCase()}: ${text}`);
    }
  });
  
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
    
    // Test practice quiz database save
    console.log('🎯 Step 3: Test Practice Quiz Database Save');
    await page.click('#btn-practice');
    await page.waitForTimeout(2000);
    
    // Answer all questions quickly
    const questionCount = await page.locator('.question-card').count();
    console.log(`Found ${questionCount} questions to answer`);
    
    for (let i = 0; i < questionCount; i++) {
      await page.locator('.question-card').nth(i).locator('input[type="radio"]').first().click();
      await page.waitForTimeout(200);
    }
    
    // Submit practice quiz
    console.log('📤 Submitting practice quiz...');
    await page.click('#btn-submit');
    await page.waitForTimeout(5000); // Wait for database save
    
    // Go back home
    await page.click('#btn-home');
    await page.waitForTimeout(3000);
    
    // Test required quiz database save and restriction
    console.log('📝 Step 4: Test Required Quiz Database Save');
    const requiredBtn = page.locator('#btn-required');
    const isEnabled = await requiredBtn.isEnabled();
    const buttonText = await requiredBtn.textContent();
    
    console.log(`Required button enabled: ${isEnabled}, text: "${buttonText}"`);
    
    if (isEnabled && !buttonText.includes('Completed')) {
      await requiredBtn.click();
      await page.waitForTimeout(2000);
      
      // Answer all questions quickly
      const questionCount2 = await page.locator('.question-card').count();
      console.log(`Found ${questionCount2} questions for required quiz`);
      
      for (let i = 0; i < questionCount2; i++) {
        await page.locator('.question-card').nth(i).locator('input[type="radio"]').first().click();
        await page.waitForTimeout(200);
      }
      
      // Submit required quiz
      console.log('📤 Submitting required quiz...');
      await page.click('#btn-submit');
      await page.waitForTimeout(8000); // Wait longer for database save and UI refresh
      
      // Go back home and check if button is now disabled
      await page.click('#btn-home');
      await page.waitForTimeout(3000);
      
      // Check button status after completion
      const requiredBtn2 = page.locator('#btn-required');
      const isEnabled2 = await requiredBtn2.isEnabled();
      const buttonText2 = await requiredBtn2.textContent();
      
      console.log(`After required quiz - Button enabled: ${isEnabled2}, text: "${buttonText2}"`);
      
      // Test that clicking again shows restriction
      if (isEnabled2) {
        console.log('⚠️ Step 5: Test weekly restriction');
        await requiredBtn2.click();
        await page.waitForTimeout(2000);
      }
      
    } else {
      console.log('ℹ️ Required quiz already completed or disabled');
    }
    
    await page.screenshot({ path: 'test_quiz_database_final.png', fullPage: true });
    
    console.log('✅ Database test completed');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    await page.screenshot({ path: 'test_quiz_database_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testQuizDatabase();