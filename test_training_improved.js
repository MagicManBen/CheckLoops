import { chromium } from 'playwright';

async function testTrainingPage() {
  console.log('Starting training page test...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Login
    console.log('1. Logging in...');
    await page.goto('http://127.0.0.1:58156/index.html');
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Navigate to staff area
    console.log('2. Navigating to staff area...');
    await page.click('button[data-section="staff"]');
    await page.waitForTimeout(2000);
    
    // Navigate to training page
    console.log('3. Going to training page...');
    await page.click('a[href="staff-training.html"]');
    await page.waitForTimeout(3000);
    
    // Take screenshot of the training page
    console.log('4. Taking screenshot of training page...');
    await page.screenshot({ path: 'test_training_page_improved.png', fullPage: true });
    
    // Click on a training row to open modal
    console.log('5. Clicking on a training row...');
    const firstRow = await page.locator('#training-table tbody tr').first();
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot of modal
      console.log('6. Taking screenshot of modal...');
      await page.screenshot({ path: 'test_training_modal.png' });
      
      // Fill in the form
      console.log('7. Filling training form...');
      
      // Select expiry period
      await page.selectOption('#training-expiry-period', '6months');
      await page.waitForTimeout(500);
      
      // Add notes
      await page.fill('#training-notes', 'Test training record added via automated test');
      
      // Take screenshot before saving
      console.log('8. Taking screenshot of filled form...');
      await page.screenshot({ path: 'test_training_form_filled.png' });
      
      // Save the record
      console.log('9. Saving training record...');
      await page.click('#training-save-btn');
      await page.waitForTimeout(3000);
      
      // Take final screenshot
      console.log('10. Taking final screenshot...');
      await page.screenshot({ path: 'test_training_final_improved.png', fullPage: true });
      
    } else {
      console.log('No training rows found, trying Upload Training button...');
      await page.click('#upload-training-btn');
      await page.waitForTimeout(1000);
      
      // Take screenshot of empty modal
      await page.screenshot({ path: 'test_training_modal_empty.png' });
      
      // Select a training type if available
      const options = await page.locator('#training-type-select option').count();
      if (options > 1) {
        await page.selectOption('#training-type-select', { index: 1 });
        await page.waitForTimeout(500);
        
        // Select expiry period
        await page.selectOption('#training-expiry-period', '1year');
        await page.waitForTimeout(500);
        
        // Add notes
        await page.fill('#training-notes', 'Test training record - no certificate');
        
        // Take screenshot
        await page.screenshot({ path: 'test_training_form_new.png' });
        
        // Save
        await page.click('#training-save-btn');
        await page.waitForTimeout(3000);
        
        // Final screenshot
        await page.screenshot({ path: 'test_training_saved.png', fullPage: true });
      }
    }
    
    console.log('✅ Training page test completed successfully!');
    console.log('Check the screenshots to verify:');
    console.log('- test_training_page_improved.png - Main training page with expiry countdown');
    console.log('- test_training_modal.png - Modal popup');
    console.log('- test_training_form_filled.png - Filled form');
    console.log('- test_training_final_improved.png - After saving');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test_training_error.png' });
  } finally {
    await browser.close();
  }
}

testTrainingPage();