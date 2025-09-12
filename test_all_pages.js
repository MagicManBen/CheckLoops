import { chromium } from 'playwright';

async function testAllPages() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('1. Testing login flow...');
  
  // Navigate to home.html for login
  await page.goto('http://127.0.0.1:5500/home.html');
  await page.waitForTimeout(2000);
  
  // Fill in login credentials
  await page.fill('#email', 'benhowardmagic@hotmail.com');
  await page.fill('input[type="password"]', 'Hello1!');
  
  // Take screenshot of login page
  await page.screenshot({ path: 'test_1_login_page.png', fullPage: true });
  
  // Click sign in
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Should be redirected to staff.html
  console.log('2. Testing staff.html...');
  await page.screenshot({ path: 'test_2_staff_home.png', fullPage: true });
  console.log('Current URL:', page.url());
  
  // Check for user info on staff.html
  const staffPageText = await page.textContent('body');
  console.log('Looking for Ben/Admin on staff.html:', 
    staffPageText.includes('Ben') || staffPageText.includes('ben') || staffPageText.includes('Admin'));
  
  // Test staff-welcome.html
  console.log('3. Testing staff-welcome.html...');
  await page.goto('http://127.0.0.1:5500/staff-welcome.html');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test_3_staff_welcome.png', fullPage: true });
  
  // Test staff-meetings.html
  console.log('4. Testing staff-meetings.html...');
  await page.goto('http://127.0.0.1:5500/staff-meetings.html');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test_4_staff_meetings.png', fullPage: true });
  
  // Test staff-scans.html
  console.log('5. Testing staff-scans.html...');
  await page.goto('http://127.0.0.1:5500/staff-scans.html');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test_5_staff_scans.png', fullPage: true });
  
  // Test staff-training.html
  console.log('6. Testing staff-training.html...');
  await page.goto('http://127.0.0.1:5500/staff-training.html');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test_6_staff_training.png', fullPage: true });
  
  // Test achievements.html
  console.log('7. Testing achievements.html...');
  await page.goto('http://127.0.0.1:5500/achievements.html');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test_7_achievements.png', fullPage: true });
  
  // Test staff-quiz.html
  console.log('8. Testing staff-quiz.html...');
  await page.goto('http://127.0.0.1:5500/staff-quiz.html');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test_8_staff_quiz.png', fullPage: true });
  
  // Test admin.html (via index.html redirect)
  console.log('9. Testing admin page (index.html)...');
  await page.goto('http://127.0.0.1:5500/index.html');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test_9_admin.png', fullPage: true });
  console.log('Admin page URL:', page.url());
  
  // Check for user info on admin page
  const adminPageText = await page.textContent('body');
  console.log('Looking for email/Admin on admin.html:', 
    adminPageText.includes('benhowardmagic@hotmail.com') || adminPageText.includes('Admin'));
  
  console.log('\n=== TEST COMPLETE ===');
  console.log('Screenshots saved as test_1_*.png through test_9_*.png');
  console.log('Please review the screenshots to identify display issues.');
  
  await browser.close();
}

testAllPages().catch(console.error);