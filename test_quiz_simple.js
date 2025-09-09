import { chromium } from 'playwright';

async function testQuizSimple() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate and login
    console.log('1. Navigating to staff-quiz.html...');
    await page.goto('http://127.0.0.1:58156/staff-quiz.html');
    await page.waitForTimeout(2000);
    
    // Login if needed
    if (await page.locator('#email').isVisible()) {
      console.log('2. Logging in...');
      await page.locator('#email').fill('benhowardmagic@hotmail.com');
      await page.locator('#password').fill('Hello1!');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
      await page.goto('http://127.0.0.1:58156/staff-quiz.html');
      await page.waitForTimeout(2000);
    }
    
    console.log('3. Testing Practice Quiz...');
    // Click the practice button - new UI uses different text
    await page.locator('#btn-practice').click({ force: true });
    await page.waitForTimeout(3000);
    
    // Check if questions loaded - new UI uses .question-card
    const questions = await page.locator('.question-card').all();
    console.log(`   Found ${questions.length} questions`);
    
    if (questions.length > 0) {
      console.log('   ✓ Questions loaded successfully!');
      
      // Answer all questions
      for (let i = 0; i < questions.length; i++) {
        await page.locator(`input[name="q_${i}"]`).first().click({ force: true });
      }
      
      await page.screenshot({ path: 'quiz_practice_answered.png' });
      console.log('   Screenshot: quiz_practice_answered.png');
      
      // Submit
      await page.locator('#btn-submit').click({ force: true });
      await page.waitForTimeout(3000);
      
      const result = await page.locator('#score-display').textContent();
      console.log('   Result:', result);
      
      await page.screenshot({ path: 'quiz_practice_result.png' });
      console.log('   Screenshot: quiz_practice_result.png');
    } else {
      console.log('   ❌ No questions loaded!');
    }
    
    // Reload and test required quiz
    console.log('\n4. Testing Required Quiz...');
    await page.reload();
    await page.waitForTimeout(3000);
    
    await page.locator('#btn-required').click({ force: true });
    await page.waitForTimeout(3000);
    
    const reqQuestions = await page.locator('.question-card').all();
    console.log(`   Found ${reqQuestions.length} questions`);
    
    if (reqQuestions.length > 0) {
      console.log('   ✓ Required quiz loaded!');
      
      // Answer questions
      for (let i = 0; i < reqQuestions.length; i++) {
        await page.locator(`input[name="q_${i}"]`).first().click({ force: true });
      }
      
      // Submit
      await page.locator('#btn-submit').click({ force: true });
      await page.waitForTimeout(3000);
      
      const result = await page.locator('#score-display').textContent();
      console.log('   Result:', result);
      
      await page.screenshot({ path: 'quiz_required_result.png' });
      console.log('   Screenshot: quiz_required_result.png');
      
      // Check if next_quiz_due was updated
      console.log('\n5. Checking if quiz submission was recorded...');
      await page.reload();
      await page.waitForTimeout(3000);
      
      // Check if countdown is now showing
      const hasCountdown = await page.locator('.countdown-display').count() > 0;
      const completedText = await page.locator('text=/Completed This Week/i').count() > 0;
      if (hasCountdown || completedText) {
        console.log('   ✓ Quiz submission recorded - weekly requirement complete!');
      } else {
        console.log('   ⚠ No countdown showing after submission');
      }
      
      await page.screenshot({ path: 'quiz_after_submission.png' });
      console.log('   Screenshot: quiz_after_submission.png');
    }
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'quiz_error.png' });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testQuizSimple();