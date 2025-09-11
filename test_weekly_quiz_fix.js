// Test script to verify the weekly quiz restriction fix
import { chromium } from 'playwright';

async function testWeeklyQuizRestriction() {
  console.log('🧪 Starting weekly quiz restriction test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('📅') || msg.text().includes('🎯') || msg.text().includes('💾')) {
        console.log(`Browser: ${msg.text()}`);
      }
    });
    
    console.log('📋 Step 1: Navigate to quiz page');
    await page.goto('http://localhost:3000/staff-quiz.html');
    
    console.log('📋 Step 2: Wait for page load and check initial state');
    await page.waitForTimeout(3000);
    
    // Check if required quiz button exists and is enabled
    const requiredBtn = page.locator('#btn-required');
    const isInitiallyEnabled = await requiredBtn.isEnabled();
    const initialButtonText = await requiredBtn.textContent();
    
    console.log(`Initial state - Button enabled: ${isInitiallyEnabled}, text: "${initialButtonText}"`);
    
    if (isInitiallyEnabled && initialButtonText.includes('Start Required Quiz')) {
      console.log('📋 Step 3: Taking required quiz (first attempt)');
      
      // Start required quiz
      await requiredBtn.click();
      await page.waitForTimeout(2000);
      
      console.log('📋 Step 4: Answer all questions');
      // Answer all 10 questions (just pick the first option for each)
      for (let i = 0; i < 10; i++) {
        const questionSelector = `input[name="q_${i}"]`;
        const firstOption = page.locator(questionSelector).first();
        if (await firstOption.isVisible()) {
          await firstOption.click();
          console.log(`Answered question ${i + 1}`);
        }
      }
      
      console.log('📋 Step 5: Submit quiz');
      const submitBtn = page.locator('#btn-submit');
      await submitBtn.click();
      await page.waitForTimeout(5000); // Wait for submission and processing
      
      console.log('📋 Step 6: Go back to home');
      const homeBtn = page.locator('#btn-home');
      await homeBtn.click();
      await page.waitForTimeout(3000);
      
      console.log('📋 Step 7: Check if button is now disabled');
      const isDisabledAfter = await requiredBtn.isDisabled();
      const buttonTextAfter = await requiredBtn.textContent();
      
      console.log(`After quiz - Button disabled: ${isDisabledAfter}, text: "${buttonTextAfter}"`);
      
      if (isDisabledAfter && buttonTextAfter.includes('Completed This Week')) {
        console.log('✅ SUCCESS: Button properly disabled after completion');
      } else {
        console.log('❌ FAIL: Button not properly disabled');
      }
      
      console.log('📋 Step 8: Test restriction by trying to start quiz again');
      if (!isDisabledAfter) {
        await requiredBtn.click();
        await page.waitForTimeout(2000);
        
        // Check if alert appeared or quiz was blocked
        console.log('Checking if quiz was properly blocked...');
      }
      
    } else {
      console.log('ℹ️ Quiz already completed this week or disabled');
    }
    
    console.log('🧪 Test completed');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    // Keep browser open for manual inspection
    console.log('Browser left open for manual inspection...');
    // await browser.close();
  }
}

// Run the test
testWeeklyQuizRestriction().catch(console.error);
