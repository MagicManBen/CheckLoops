import { chromium } from 'playwright';

async function testDirectAuth() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  console.log('Testing direct Supabase auth...');
  await page.goto('http://127.0.0.1:5500/test_supabase_direct.html');
  await page.waitForTimeout(5000);
  
  // Get the status text
  const statusText = await page.textContent('#status');
  console.log('Status:', statusText);
  
  await page.screenshot({ path: 'test_direct_auth.png', fullPage: true });
  
  // If successful, try clicking the button to go to staff page
  if (statusText.includes('Success')) {
    const button = await page.$('button');
    if (button) {
      console.log('Clicking button to go to staff page...');
      await button.click();
      await page.waitForTimeout(3000);
      console.log('Current URL:', page.url());
      await page.screenshot({ path: 'test_staff_after_auth.png', fullPage: true });
    }
  }
  
  await browser.close();
}

testDirectAuth().catch(console.error);