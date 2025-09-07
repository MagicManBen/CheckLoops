import { chromium } from 'playwright';

async function testTrainingTracker() {
  console.log('Starting training tracker test...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the application with your live server URL
    console.log('Navigating to application...');
    await page.goto('http://127.0.0.1:62752/index.html');
    await page.waitForTimeout(2000);
    
    // Login
    console.log('Logging in...');
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('input[type="password"]').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Expand the Checks & Audits menu
    console.log('Expanding Checks & Audits menu...');
    const checksToggle = page.locator('#toggle-checks');
    await checksToggle.click();
    await page.waitForTimeout(500);
    
    // Navigate to Training Tracker
    console.log('Navigating to Training Tracker...');
    await page.click('button[data-section="training"]');
    await page.waitForTimeout(3000);
    
    // Take screenshot of training tracker
    console.log('Taking screenshot of training tracker...');
    await page.screenshot({ path: 'training_tracker_final.png', fullPage: true });
    
    // Check if content is visible
    const trainingContent = await page.locator('#training-content').isVisible();
    console.log('Training content visible:', trainingContent);
    
    // Check for table or messages
    const hasTable = await page.locator('#training-content table').count() > 0;
    const hasNoDataMessage = await page.locator('#training-content:has-text("No staff members")').count() > 0;
    const hasError = await page.locator('#training-content:has-text("Failed")').count() > 0;
    
    console.log('Has table:', hasTable);
    console.log('Has no data message:', hasNoDataMessage);
    console.log('Has error:', hasError);
    
    // Try the refresh button if visible
    const refreshBtn = page.locator('button:has-text("Refresh")');
    if (await refreshBtn.isVisible()) {
      console.log('Clicking refresh button...');
      await refreshBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'training_after_refresh_final.png', fullPage: true });
    }
    
    // Check filters
    const searchInput = page.locator('#training-search');
    if (await searchInput.isVisible()) {
      console.log('Search input is visible');
    }
    
    console.log('Test completed successfully!');
    console.log('Please check the training_tracker_final.png screenshot');
    
    // Keep browser open for manual inspection
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'training_error_final.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testTrainingTracker().catch(console.error);