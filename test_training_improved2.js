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
    
    // Check if we're already on staff page or need to navigate
    const url = page.url();
    console.log('Current URL:', url);
    
    if (url.includes('staff')) {
      console.log('Already on staff page');
    } else {
      // Try to find staff navigation
      const staffLink = await page.locator('a:has-text("Staff")').count();
      if (staffLink > 0) {
        console.log('2. Clicking Staff link...');
        await page.click('a:has-text("Staff")');
        await page.waitForTimeout(2000);
      } else {
        // Check for sections
        const sections = await page.locator('[data-section]').count();
        console.log('Found sections:', sections);
        
        if (sections > 0) {
          // Look for staff section button
          await page.click('[data-section="staff"]');
          await page.waitForTimeout(2000);
        }
      }
    }
    
    // Navigate to training page
    console.log('3. Going to training page...');
    
    // Check if we have direct navigation or need to navigate differently
    const trainingLink = await page.locator('a[href="staff-training.html"]').count();
    if (trainingLink > 0) {
      await page.click('a[href="staff-training.html"]');
    } else {
      // Try navigating directly
      await page.goto('http://127.0.0.1:58156/staff-training.html');
    }
    await page.waitForTimeout(3000);
    
    // Take screenshot of the training page
    console.log('4. Taking screenshot of training page...');
    await page.screenshot({ path: 'test_training_page_improved.png', fullPage: true });
    
    // Check if we have training rows
    const rowCount = await page.locator('#training-table tbody tr').count();
    console.log('Found training rows:', rowCount);
    
    if (rowCount > 0) {
      // Click on first training row
      console.log('5. Clicking on first training row...');
      await page.locator('#training-table tbody tr').first().click();
      await page.waitForTimeout(1000);
      
      // Take screenshot of modal
      console.log('6. Taking screenshot of modal...');
      await page.screenshot({ path: 'test_training_modal.png' });
      
      // Fill in the form
      console.log('7. Filling training form...');
      
      // Check if type is already selected
      const selectedType = await page.locator('#training-type-select').inputValue();
      if (!selectedType) {
        const options = await page.locator('#training-type-select option').count();
        if (options > 1) {
          await page.selectOption('#training-type-select', { index: 1 });
        }
      }
      
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
      
      // Click upload button
      const uploadBtn = await page.locator('#upload-training-btn').count();
      if (uploadBtn > 0) {
        await page.click('#upload-training-btn');
        await page.waitForTimeout(1000);
        
        // Take screenshot of empty modal
        await page.screenshot({ path: 'test_training_modal_empty.png' });
        
        // Select a training type if available
        const options = await page.locator('#training-type-select option').count();
        console.log('Training type options:', options);
        
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
        } else {
          console.log('No training types available');
          await page.screenshot({ path: 'test_no_training_types.png' });
        }
      } else {
        console.log('Upload button not found');
        await page.screenshot({ path: 'test_page_state.png', fullPage: true });
      }
    }
    
    console.log('✅ Training page test completed!');
    console.log('Check the screenshots to verify the improvements.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test_training_error.png' });
  } finally {
    await browser.close();
  }
}

testTrainingPage();