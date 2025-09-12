import { chromium } from 'playwright';

async function testFinalVerification() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('[DOM]') && !text.includes('Environment') && !text.includes('🌍')) {
      console.log('BROWSER:', text);
    }
  });
  
  console.log('=== TESTING LOGIN THROUGH HOME.HTML ===\n');
  
  // Navigate to home.html
  await page.goto('http://127.0.0.1:5500/home.html');
  await page.waitForTimeout(2000);
  
  // Fill in login credentials
  console.log('Filling in login credentials...');
  await page.fill('#email', 'benhowardmagic@hotmail.com');
  await page.fill('input[type="password"]', 'Hello1!');
  
  // Take screenshot before login
  await page.screenshot({ path: 'final_1_login_form.png', fullPage: true });
  
  // Click sign in
  console.log('Clicking sign in...');
  await page.click('button[type="submit"]');
  
  // Wait for navigation
  await page.waitForTimeout(5000);
  
  // Check where we ended up
  const currentUrl = page.url();
  console.log('After login, current URL:', currentUrl);
  
  if (currentUrl.includes('home.html')) {
    // Check for error message
    const errorText = await page.textContent('#auth-error').catch(() => '');
    if (errorText) {
      console.log('LOGIN ERROR:', errorText);
    }
    console.log('Login failed - still on home.html');
    await page.screenshot({ path: 'final_login_failed.png', fullPage: true });
    await browser.close();
    return;
  }
  
  console.log('\n✅ Login successful! Now testing all pages...\n');
  
  const pages = [
    { name: 'Staff Home', url: 'staff.html', checkFor: ['Welcome, Ben', 'benhowardmagic@hotmail.com', 'Admin', 'Harley Street'] },
    { name: 'Staff Welcome', url: 'staff-welcome.html', checkFor: ['benhowardmagic@hotmail.com'] },
    { name: 'Staff Meetings', url: 'staff-meetings.html', checkFor: ['benhowardmagic@hotmail.com', 'Admin', 'Harley Street'] },
    { name: 'Staff Scans', url: 'staff-scans.html', checkFor: ['benhowardmagic@hotmail.com', 'Admin', 'Harley Street'] },
    { name: 'Staff Training', url: 'staff-training.html', checkFor: ['benhowardmagic@hotmail.com', 'Admin', 'Harley Street'] },
    { name: 'Achievements', url: 'achievements.html', checkFor: ['benhowardmagic@hotmail.com', 'Admin', 'Harley Street'] },
    { name: 'Staff Quiz', url: 'staff-quiz.html', checkFor: ['benhowardmagic@hotmail.com', 'Admin', 'Harley Street'] },
    { name: 'Admin (via index)', url: 'index.html', checkFor: ['benhowardmagic@hotmail.com', 'Admin', 'Harley Street'] },
    { name: 'Admin Direct', url: 'admin.html', checkFor: ['benhowardmagic@hotmail.com', 'Admin', 'Harley Street'] }
  ];
  
  for (let i = 0; i < pages.length; i++) {
    const pageInfo = pages[i];
    console.log(`\n=== ${pageInfo.name} (${pageInfo.url}) ===`);
    
    await page.goto(`http://127.0.0.1:5500/${pageInfo.url}`);
    await page.waitForTimeout(3000);
    
    const bodyText = await page.textContent('body');
    
    // Check for required text
    let allFound = true;
    for (const text of pageInfo.checkFor) {
      const found = bodyText.includes(text);
      console.log(`  ${found ? '✅' : '❌'} Has "${text}"`);
      if (!found) allFound = false;
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: `final_${i + 2}_${pageInfo.url.replace('.html', '')}.png`, 
      fullPage: true 
    });
    
    if (!allFound) {
      console.log(`  ⚠️ Missing some required text on ${pageInfo.name}`);
    }
  }
  
  console.log('\n=== FINAL VERIFICATION COMPLETE ===');
  console.log('Screenshots saved as final_*.png');
  
  await browser.close();
}

testFinalVerification().catch(console.error);