import { chromium } from 'playwright';

async function debugQuizQuestions() {
  console.log('🔍 Debugging Quiz Question Loading');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const page = await browser.newPage();
  
  // Listen to console messages
  page.on('console', msg => {
    console.log(`BROWSER: ${msg.type()}: ${msg.text()}`);
  });
  
  // Listen to network requests
  page.on('request', request => {
    if (request.url().includes('quiz_questions') || request.url().includes('supabase')) {
      console.log(`→ REQUEST: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('quiz_questions') || response.url().includes('supabase')) {
      console.log(`← RESPONSE: ${response.status()} ${response.url()}`);
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
    
    // Check if elements are present
    const homeVisible = await page.locator('#quiz-home').isVisible();
    const practiceBtn = await page.locator('#btn-practice').isVisible();
    console.log(`Quiz home visible: ${homeVisible}, Practice button visible: ${practiceBtn}`);
    
    // Click practice quiz and wait longer
    console.log('🎯 Step 3: Click Practice Quiz button');
    await page.click('#btn-practice');
    await page.waitForTimeout(5000); // Wait longer for questions to load
    
    // Take screenshot
    await page.screenshot({ path: 'debug_after_practice_click.png', fullPage: true });
    
    // Check what screens are visible
    const homeStillVisible = await page.locator('#quiz-home').isVisible();
    const activeVisible = await page.locator('#quiz-active').isVisible();
    const resultsVisible = await page.locator('#quiz-results').isVisible();
    
    console.log(`After clicking practice:`);
    console.log(`  Home visible: ${homeStillVisible}`);
    console.log(`  Active visible: ${activeVisible}`);
    console.log(`  Results visible: ${resultsVisible}`);
    
    // Check if questions container has content
    const questionsContainer = page.locator('#questions-container');
    const questionCount = await questionsContainer.locator('.question-card').count();
    const containerHTML = await questionsContainer.innerHTML();
    
    console.log(`Questions container content:`);
    console.log(`  Question count: ${questionCount}`);
    console.log(`  Container HTML length: ${containerHTML.length}`);
    
    // Check JavaScript variables
    const jsDebug = await page.evaluate(() => {
      return {
        currentQuestions: window.currentQuestions ? window.currentQuestions.length : 'undefined',
        currentMode: window.currentMode,
        userAnswers: window.userAnswers ? Object.keys(window.userAnswers).length : 'undefined',
        fetchQuestionsExists: typeof window.fetchQuestions === 'function'
      };
    });
    
    console.log('JavaScript state:', jsDebug);
    
    console.log('✅ Debug complete - check console output and screenshot');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    await page.screenshot({ path: 'debug_error.png', fullPage: true });
  } finally {
    // Keep browser open for manual inspection
    console.log('🔍 Browser kept open for manual inspection - close manually when done');
    // Don't close browser automatically so we can inspect
    // await browser.close();
  }
}

debugQuizQuestions();