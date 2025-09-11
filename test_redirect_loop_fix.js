import { chromium } from 'playwright';

async function testRedirectLoopFix() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing redirect loop fix...');
  
  try {
    // Navigate to Home.html (the URL that was causing the loop)
    console.log('Navigating to Home.html...');
    await page.goto('http://127.0.0.1:5500/Home.html', { waitUntil: 'networkidle' });
    
    // Wait for a few seconds to see if there are multiple redirects
    console.log('Waiting 5 seconds to check for redirect loops...');
    await page.waitForTimeout(5000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`Current URL after 5 seconds: ${currentUrl}`);
    
    // Take screenshot of current state
    await page.screenshot({ path: 'redirect_loop_test.png' });
    console.log('Screenshot saved as redirect_loop_test.png');
    
    // Check if we can see the login form (meaning we're not in a loop)
    const loginForm = await page.locator('#signin-form').isVisible();
    console.log(`Login form visible: ${loginForm}`);
    
    // Check if there are any error messages
    const errorElement = await page.locator('#auth-error').isVisible();
    if (errorElement) {
      const errorText = await page.locator('#auth-error').textContent();
      console.log(`Error message: ${errorText}`);
    }
    
    // Check browser console for any errors
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    
    if (loginForm && currentUrl.includes('Home.html')) {
      console.log('✅ SUCCESS: Redirect loop has been fixed!');
      console.log('The page stays on Home.html and shows the login form.');
    } else {
      console.log('❌ ISSUE: Still experiencing redirect problems.');
      console.log(`Expected to be on Home.html with login form, but got: ${currentUrl}`);
    }
    
    console.log('\nBrowser console logs:');
    logs.forEach(log => console.log(`  ${log}`));
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testRedirectLoopFix();