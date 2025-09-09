import { chromium } from 'playwright';

async function testQuizWithConsole() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Browser error:', msg.text());
    } else if (msg.text().includes('Error') || msg.text().includes('error')) {
      console.log('⚠️ Browser warning:', msg.text());
    } else if (msg.text().includes('Using fallback questions')) {
      console.log('📝 Browser log:', msg.text());
    }
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.log('❌ Page error:', error.message);
  });
  
  try {
    console.log('1. Loading quiz page...');
    await page.goto('http://127.0.0.1:58156/staff-quiz.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Login
    if (await page.locator('#email').isVisible()) {
      console.log('2. Logging in...');
      await page.locator('#email').fill('benhowardmagic@hotmail.com');
      await page.locator('#password').fill('Hello1!');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
      await page.goto('http://127.0.0.1:58156/staff-quiz.html');
      await page.waitForTimeout(2000);
    }
    
    console.log('3. Clicking Practice Quiz button...');
    await page.locator('#btn-practice').click();
    await page.waitForTimeout(3000);
    
    // Check what's visible
    const quizActive = await page.locator('#quiz-active').isVisible();
    const quizHome = await page.locator('#quiz-home').isVisible();
    const questions = await page.locator('.question-card').count();
    
    console.log('4. Quiz state:');
    console.log('   - Quiz active section visible:', quizActive);
    console.log('   - Quiz home section visible:', quizHome);
    console.log('   - Number of questions:', questions);
    
    // Check if questions container exists
    const container = await page.locator('#questions-container').count();
    console.log('   - Questions container exists:', container > 0);
    
    if (container > 0) {
      const containerHTML = await page.locator('#questions-container').innerHTML();
      console.log('   - Container HTML length:', containerHTML.length);
      if (containerHTML.length < 50) {
        console.log('   - Container HTML:', containerHTML);
      }
    }
    
    // Try to manually trigger fetchQuestions in console
    console.log('\n5. Testing fetchQuestions function...');
    try {
      const result = await page.evaluate(() => {
        if (typeof fetchQuestions === 'function') {
          return fetchQuestions().then(q => ({
            success: true,
            count: q.length,
            sample: q[0]
          }));
        } else {
          return { success: false, error: 'fetchQuestions not defined' };
        }
      });
      console.log('   - fetchQuestions result:', result);
    } catch (err) {
      console.log('   - fetchQuestions error:', err.message);
    }
    
    await page.screenshot({ path: 'quiz_debug.png' });
    console.log('\n📸 Screenshot saved: quiz_debug.png');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    console.log('\nKeeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testQuizWithConsole();