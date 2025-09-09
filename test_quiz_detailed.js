import { chromium } from 'playwright';

async function testQuizWithLogging() {
  console.log('🔬 Detailed Quiz Logging Test');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  const page = await browser.newPage();
  
  // Capture all console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (text.includes('🔍') || text.includes('🎯') || text.includes('🎨')) {
      console.log(`BROWSER ${type.toUpperCase()}: ${text}`);
    }
  });
  
  try {
    // Login
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Navigate to quiz
    await page.click('a[href="staff-quiz.html"]');
    await page.waitForTimeout(3000);
    
    // Click practice quiz
    console.log('👆 CLICKING PRACTICE BUTTON');
    await page.click('#btn-practice');
    
    // Wait longer for all async operations
    await page.waitForTimeout(8000);
    
    // Check final state
    const homeVisible = await page.locator('#quiz-home').isVisible();
    const activeVisible = await page.locator('#quiz-active').isVisible();
    const questionCount = await page.locator('.question-card').count();
    
    console.log(`\nFINAL STATE:`);
    console.log(`  Home visible: ${homeVisible}`);
    console.log(`  Active visible: ${activeVisible}`);
    console.log(`  Question cards: ${questionCount}`);
    
    await page.screenshot({ path: 'detailed_test_result.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testQuizWithLogging();