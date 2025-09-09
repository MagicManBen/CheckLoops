import { chromium } from 'playwright';

async function testCompleteAdminFlow() {
  console.log('🔬 Complete Admin Flow Test - Clear Database, Test Quiz, Verify Save');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const context = await browser.newContext();
  
  try {
    // Step 1: Clear database using admin tool
    console.log('📋 Step 1: Clear existing quiz data');
    const adminPage = await context.newPage();
    await adminPage.goto('http://127.0.0.1:58156/test_admin_data_loaded.html');
    await adminPage.waitForTimeout(2000);
    
    // Clear all data
    await adminPage.click('button:has-text("Clear All Quiz Data")');
    await adminPage.waitForTimeout(5000); // Wait for database operations
    
    // Get the output to verify clearing
    const clearOutput = await adminPage.locator('#output').textContent();
    console.log('🗑️ Database clearing results:');
    const lines = clearOutput.split('\n').slice(-5); // Get last 5 lines
    lines.forEach(line => line.trim() && console.log('  ' + line));
    
    // Step 2: Test required quiz submission
    console.log('\n📝 Step 2: Test Required Quiz Submission');
    const quizPage = await context.newPage();
    
    // Login
    await quizPage.goto('http://127.0.0.1:58156/Home.html');
    await quizPage.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await quizPage.locator('#password').fill('Hello1!');
    await quizPage.click('button:has-text("Sign In")');
    await quizPage.waitForTimeout(3000);
    
    // Navigate to quiz
    await quizPage.click('a[href="staff-quiz.html"]');
    await quizPage.waitForTimeout(3000);
    
    // Verify required quiz button is enabled
    const requiredBtn = quizPage.locator('#btn-required');
    const isEnabled = await requiredBtn.isEnabled();
    const buttonText = await requiredBtn.textContent();
    console.log(`  Required button enabled: ${isEnabled}, text: "${buttonText.trim()}"`);
    
    if (!isEnabled) {
      console.log('❌ Required quiz button is disabled - database may not be cleared properly');
      return;
    }
    
    // Start required quiz
    await requiredBtn.click();
    await quizPage.waitForTimeout(2000);
    
    // Answer all questions
    const questionCount = await quizPage.locator('.question-card').count();
    console.log(`  Answering ${questionCount} questions...`);
    
    for (let i = 0; i < questionCount; i++) {
      await quizPage.locator('.question-card').nth(i).locator('input[type="radio"]').first().click();
      await quizPage.waitForTimeout(200);
    }
    
    // Submit required quiz
    console.log('  Submitting required quiz...');
    await quizPage.click('#btn-submit');
    await quizPage.waitForTimeout(8000); // Wait for database save and UI refresh
    
    // Check results
    const resultsVisible = await quizPage.locator('#quiz-results').isVisible();
    if (resultsVisible) {
      const scoreText = await quizPage.locator('#score-display').textContent();
      console.log(`  ✅ Quiz completed! Score: ${scoreText}`);
    }
    
    // Return to home and verify button is disabled
    await quizPage.click('#btn-home');
    await quizPage.waitForTimeout(3000);
    
    const requiredBtn2 = quizPage.locator('#btn-required');
    const isEnabled2 = await requiredBtn2.isEnabled();
    const buttonText2 = await requiredBtn2.textContent();
    console.log(`  After submission - Button enabled: ${isEnabled2}, text: "${buttonText2.trim()}"`);
    
    // Step 3: Check database to see where data was saved
    console.log('\n🔍 Step 3: Check Database for Saved Data');
    
    // Switch back to admin page and check data
    await adminPage.bringToFront();
    await adminPage.click('button:has-text("Check Current Data")');
    await adminPage.waitForTimeout(5000);
    
    // Get the final output
    const finalOutput = await adminPage.locator('#output').textContent();
    console.log('📊 Database check results:');
    const finalLines = finalOutput.split('\n');
    
    // Look for specific table information
    let foundAttempts = false;
    let foundPractices = false;
    
    finalLines.forEach(line => {
      if (line.includes('quiz attempts for this user in QUIZ_ATTEMPTS')) {
        console.log('  📝 ' + line.trim());
        foundAttempts = true;
      }
      if (line.includes('quiz practices for this user in QUIZ_PRACTICES')) {
        console.log('  🎯 ' + line.trim());
        foundPractices = true;
      }
      if (line.includes('ID:') && line.includes('Practice: false')) {
        console.log('  ✅ REQUIRED QUIZ SAVED: ' + line.trim());
      }
    });
    
    // Summary
    console.log('\n📋 SUMMARY:');
    console.log('  Database clearing: ✅ Completed');
    console.log('  Required quiz submission: ✅ Completed');
    console.log(`  Data saved to quiz_attempts table: ${foundAttempts ? '✅ YES' : '❌ NO'}`);
    console.log(`  Required quiz entries found: ${finalOutput.includes('Practice: false') ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n🎯 ANSWER TO YOUR QUESTION:');
    if (foundAttempts && finalOutput.includes('Practice: false')) {
      console.log('✅ Required quiz submissions are saved in the QUIZ_ATTEMPTS table');
    } else {
      console.log('❌ Issue found with required quiz saving');
    }
    
    // Take screenshots for verification
    await adminPage.screenshot({ path: 'test_admin_data_loaded.png', fullPage: true });
    await quizPage.screenshot({ path: 'test_quiz_after_required.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Admin flow test failed:', error);
  } finally {
    await browser.close();
  }
}

testCompleteAdminFlow();