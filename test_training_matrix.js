import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  headless: false,
  slowMo: 300
});
const page = await browser.newPage();

// Enable console logging to see what's happening
page.on('console', msg => {
  if (msg.type() === 'log' || msg.type() === 'info') {
    console.log('Browser console:', msg.text());
  } else if (msg.type() === 'error') {
    console.error('Browser error:', msg.text());
  }
});

try {
  console.log('1. Loading page...');
  await page.goto('http://127.0.0.1:58156/index.html');
  await page.waitForTimeout(2000);
  
  console.log('2. Logging in...');
  // Fill email
  await page.fill('input[type="email"]', 'ben.howard@stoke.nhs.uk');
  // Fill password
  await page.fill('input[type="password"]', 'Hello1!');
  // Click sign in
  await page.click('button:has-text("Sign In")');
  
  console.log('3. Waiting for login to complete...');
  await page.waitForTimeout(4000);
  
  console.log('4. Going to training section...');
  await page.click('button[data-section="training"]');
  
  console.log('5. Waiting for training matrix to load...');
  await page.waitForTimeout(5000);
  
  console.log('6. Checking training matrix content...');
  
  // Check if loading message is still there
  const loadingVisible = await page.locator('td:has-text("Loading training matrix")').isVisible().catch(() => false);
  console.log('Loading message still visible?', loadingVisible);
  
  // Check for any table content
  const tableContent = await page.locator('#training-tbody').innerText().catch(() => 'Could not get table content');
  console.log('Table content:', tableContent);
  
  // Take a screenshot
  await page.screenshot({ path: 'training_matrix_result.png', fullPage: true });
  console.log('Screenshot saved as training_matrix_result.png');
  
  // Keep browser open for manual inspection
  console.log('Keeping browser open for 10 seconds for inspection...');
  await page.waitForTimeout(10000);
  
} catch (error) {
  console.error('Test failed:', error);
  await page.screenshot({ path: 'training_matrix_error.png' });
} finally {
  await browser.close();
  console.log('Test complete');
}
