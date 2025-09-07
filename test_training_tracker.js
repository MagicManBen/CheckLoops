import { chromium } from 'playwright';

async function testTrainingTracker() {
  console.log('Starting training tracker test...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    console.log('Navigating to application...');
    await page.goto('http://localhost:5173/index.html');
    await page.waitForTimeout(2000);
    
    // Login
    console.log('Logging in...');
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('input[type="password"]').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Navigate to Training Tracker
    console.log('Navigating to Training Tracker...');
    await page.click('button[data-section="training"]');
    await page.waitForTimeout(5000);
    
    // Take screenshot of training tracker
    console.log('Taking screenshot of training tracker...');
    await page.screenshot({ path: 'training_tracker_test.png', fullPage: true });
    
    // Check if content is visible
    const trainingContent = await page.locator('#training-content').isVisible();
    console.log('Training content visible:', trainingContent);
    
    // Check for table or error message
    const hasTable = await page.locator('table').count() > 0;
    const hasError = await page.locator('text=/failed|error/i').count() > 0;
    const hasLoading = await page.locator('text=/loading/i').count() > 0;
    
    console.log('Has table:', hasTable);
    console.log('Has error:', hasError);
    console.log('Has loading:', hasLoading);
    
    // Try refresh button if it exists
    const refreshBtn = page.locator('#btn-refresh-training');
    if (await refreshBtn.isVisible()) {
      console.log('Clicking refresh button...');
      await refreshBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'training_after_refresh.png', fullPage: true });
    }
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'training_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testTrainingTracker().catch(console.error);