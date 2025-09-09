import { chromium } from 'playwright';

async function testQuizButtons() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    console.log(`Browser console [${msg.type()}]:`, msg.text());
  });
  
  // Capture errors
  page.on('pageerror', error => {
    console.log('❌ Page error:', error.message);
  });
  
  try {
    console.log('=== TESTING QUIZ START BUTTONS ===\n');
    
    // Navigate directly to quiz page
    console.log('1. Navigating to quiz page...');
    await page.goto('http://127.0.0.1:58156/staff-quiz.html');
    await page.waitForTimeout(3000);
    
    let currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    // Check if we need to login
    if (page.url().includes('Home.html')) {
      console.log('2. Need to login...');
      await page.locator('#email').fill('benhowardmagic@hotmail.com');
      await page.locator('#password').fill('Hello1!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
      
      // Navigate to quiz again
      await page.goto('http://127.0.0.1:58156/staff-quiz.html');
      await page.waitForTimeout(3000);
    }
    
    currentUrl = page.url();
    console.log('   Quiz page URL:', currentUrl);
    
    // Check if page elements exist
    console.log('\n3. Checking page elements...');
    const practiceBtn = await page.locator('#btn-practice').count();
    const requiredBtn = await page.locator('#btn-required').count();
    const welcomeBanner = await page.locator('.welcome-banner').count();
    
    console.log(`   Practice button: ${practiceBtn > 0 ? '✓' : '✗'}`);
    console.log(`   Required button: ${requiredBtn > 0 ? '✓' : '✗'}`);
    console.log(`   Welcome banner: ${welcomeBanner > 0 ? '✓' : '✗'}`);
    
    await page.screenshot({ path: 'quiz_buttons_initial.png' });
    console.log('   Screenshot: quiz_buttons_initial.png');
    
    // Test Practice button
    if (practiceBtn > 0) {
      console.log('\n4. Testing Practice button...');
      await page.locator('#btn-practice').click({ timeout: 5000 });
      await page.waitForTimeout(3000);
      
      const quizActive = await page.locator('#quiz-active').isVisible();
      const questions = await page.locator('.question-card').count();
      
      console.log(`   Quiz active section visible: ${quizActive ? '✓' : '✗'}`);
      console.log(`   Questions loaded: ${questions}`);
      
      await page.screenshot({ path: 'quiz_practice_started.png' });
      console.log('   Screenshot: quiz_practice_started.png');
      
      if (questions > 0) {
        console.log('   ✅ Practice quiz started successfully!');
      } else {
        console.log('   ❌ Practice quiz did not load questions');
      }
    }
    
    console.log('\n=== QUIZ BUTTON TEST COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'quiz_button_error.png' });
  } finally {
    console.log('\nKeeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testQuizButtons();