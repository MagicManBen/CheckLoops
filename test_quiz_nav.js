import { chromium } from 'playwright';

async function testQuizNav() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('=== TESTING QUIZ NAVIGATION ===\n');
    
    // Login first
    console.log('1. Logging in...');
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    let currentUrl = page.url();
    console.log('   After login:', currentUrl);
    
    // Should be on staff.html
    if (currentUrl.includes('staff.html')) {
      console.log('   ✓ Successfully on staff page');
      
      // Look for Quiz links
      const quizBubble = await page.locator('#quiz-bubble');
      const takeQuizBtn = await page.locator('.quiz-alert-btn');
      
      console.log('\n2. Checking Quiz navigation options...');
      const bubbleExists = await quizBubble.count() > 0;
      const alertBtnExists = await takeQuizBtn.count() > 0;
      
      console.log(`   Quiz bubble exists: ${bubbleExists ? '✓' : '✗'}`);
      console.log(`   Take Quiz button exists: ${alertBtnExists ? '✓' : '✗'}`);
      
      if (bubbleExists) {
        console.log('\n3. Clicking Quiz bubble...');
        await page.screenshot({ path: 'before_quiz_click.png' });
        
        await quizBubble.click();
        await page.waitForTimeout(5000);
        
        currentUrl = page.url();
        console.log('   After clicking Quiz bubble:', currentUrl);
        console.log('   ✓ Should be staff-quiz.html:', currentUrl.includes('staff-quiz.html'));
        
        await page.screenshot({ path: 'after_quiz_click.png' });
        
        // Check if quiz page loaded properly
        const welcomeBanner = await page.locator('.welcome-banner').count();
        const modeCards = await page.locator('.mode-card').count();
        
        console.log('   Quiz page elements loaded:');
        console.log(`     Welcome banner: ${welcomeBanner > 0 ? '✓' : '✗'}`);
        console.log(`     Mode cards: ${modeCards}`);
        
        if (welcomeBanner > 0) {
          console.log('   ✅ Quiz page loaded successfully!');
        } else {
          console.log('   ❌ Quiz page did not load properly');
        }
      }
      
      // Test going back to staff page
      console.log('\n4. Testing back navigation...');
      await page.goBack();
      await page.waitForTimeout(3000);
      
      currentUrl = page.url();
      console.log('   After going back:', currentUrl);
      console.log('   ✓ Back on staff page:', currentUrl.includes('staff.html'));
      
    } else {
      console.log('   ❌ Not on staff page after login');
    }
    
    console.log('\n=== QUIZ NAVIGATION TEST COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'quiz_nav_error.png' });
  } finally {
    console.log('\nKeeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testQuizNav();