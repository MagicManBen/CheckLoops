import { chromium } from 'playwright';

async function debugLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  console.log('1. Navigating to home.html...');
  await page.goto('http://127.0.0.1:5500/home.html');
  await page.waitForTimeout(2000);
  
  // Fill in login credentials
  console.log('2. Filling in credentials...');
  await page.fill('#email', 'benhowardmagic@hotmail.com');
  await page.fill('input[type="password"]', 'Hello1!');
  
  // Take screenshot before login
  await page.screenshot({ path: 'debug_1_before_login.png', fullPage: true });
  
  // Click sign in and wait for response
  console.log('3. Clicking sign in button...');
  await page.click('button[type="submit"]');
  
  // Wait for either navigation or error message
  await page.waitForTimeout(5000);
  
  // Check current URL
  console.log('4. Current URL after login attempt:', page.url());
  
  // Take screenshot after login attempt
  await page.screenshot({ path: 'debug_2_after_login.png', fullPage: true });
  
  // Check for error message
  const errorElement = await page.$('#auth-error');
  if (errorElement) {
    const errorText = await errorElement.textContent();
    console.log('ERROR MESSAGE:', errorText);
  }
  
  // Check for success message
  const successElement = await page.$('#auth-success');
  if (successElement) {
    const successText = await successElement.textContent();
    console.log('SUCCESS MESSAGE:', successText);
  }
  
  // Check localStorage for auth token
  const localStorage = await page.evaluate(() => {
    const items = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key.includes('supabase') || key.includes('sb-')) {
        items[key] = window.localStorage.getItem(key);
      }
    }
    return items;
  });
  
  console.log('5. LocalStorage auth items:', Object.keys(localStorage));
  
  // If we're still on home.html, try to manually navigate to staff.html
  if (page.url().includes('home.html')) {
    console.log('6. Still on home.html, trying to navigate to staff.html...');
    await page.goto('http://127.0.0.1:5500/staff.html');
    await page.waitForTimeout(3000);
    console.log('7. URL after manual navigation:', page.url());
    await page.screenshot({ path: 'debug_3_staff_page.png', fullPage: true });
  }
  
  await browser.close();
}

debugLogin().catch(console.error);