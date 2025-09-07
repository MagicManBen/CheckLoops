import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  headless: false,
  slowMo: 200
});
const page = await browser.newPage();

// Enable console logging
page.on('console', msg => {
  const text = msg.text();
  if (text.includes('Training data loaded') || text.includes('loadTrainingMatrix')) {
    console.log('🔍 Browser:', text);
  }
});

try {
  console.log('Step 1: Loading page...');
  await page.goto('http://127.0.0.1:58156/index.html');
  await page.waitForLoadState('networkidle');
  
  console.log('Step 2: Logging in...');
  await page.fill('input[type="email"]', 'ben.howard@stoke.nhs.uk');
  await page.fill('input[type="password"]', 'Hello1!');
  await page.click('button:has-text("Sign In")');
  
  console.log('Step 3: Waiting for dashboard to load...');
  await page.waitForSelector('.cqc-score', { timeout: 10000 });
  console.log('✅ Dashboard loaded successfully');
  
  console.log('Step 4: Clicking Training section...');
  // Find and click the Training button in the sidebar
  const trainingBtn = page.locator('nav').locator('text=Training').first();
  await trainingBtn.click();
  
  console.log('Step 5: Waiting for training matrix...');
  await page.waitForTimeout(3000);
  
  // Check the table content
  const tbody = page.locator('#training-tbody');
  const hasLoadingMessage = await tbody.locator('text=Loading training matrix').isVisible().catch(() => false);
  
  if (hasLoadingMessage) {
    console.log('❌ Still showing "Loading training matrix..." message');
  } else {
    const rows = await tbody.locator('tr').count();
    console.log(`✅ Training matrix loaded with ${rows} rows`);
    
    // Get first row text to verify data
    if (rows > 0) {
      const firstRowText = await tbody.locator('tr').first().innerText().catch(() => '');
      console.log('First row content:', firstRowText.substring(0, 100));
    }
  }
  
  // Take final screenshot
  await page.screenshot({ path: 'training_matrix_final.png', fullPage: true });
  console.log('📸 Screenshot saved as training_matrix_final.png');
  
  console.log('Keeping browser open for 5 seconds...');
  await page.waitForTimeout(5000);
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  await page.screenshot({ path: 'training_error_final.png' });
} finally {
  await browser.close();
  console.log('Test complete');
}
