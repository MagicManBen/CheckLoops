import { chromium } from 'playwright';

async function testTrainingUpload() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Set user agent to avoid blocks
  await page.setExtraHTTPHeaders({ 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' });

  try {
    console.log('Starting training upload test...');

    // Login flow
    await page.goto('http://127.0.0.1:58156/index.html');
    console.log('Navigated to login page');
    
    // Take screenshot before login
    await page.screenshot({ path: 'test_login_before.png' });
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    
    console.log('Logged in, waiting for navigation...');
    await page.waitForTimeout(3000);
    
    // Navigate to staff training page
    await page.goto('http://127.0.0.1:58156/staff-training.html');
    console.log('Navigated to staff training page');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Take screenshot of training page
    await page.screenshot({ path: 'test_training_page.png' });
    
    // Check if upload button exists
    const uploadButton = await page.locator('#upload-training-btn');
    if (await uploadButton.isVisible()) {
      console.log('✓ Upload button is visible');
    } else {
      console.log('✗ Upload button is not visible');
      await browser.close();
      return;
    }
    
    // Click upload button to open modal
    await uploadButton.click();
    console.log('Clicked upload training button');
    
    // Wait for modal to appear
    await page.waitForTimeout(1000);
    
    // Take screenshot of modal
    await page.screenshot({ path: 'test_upload_modal.png' });
    
    // Check if modal elements exist
    const modal = await page.locator('#training-upload-modal');
    const typeSelect = await page.locator('#training-type-select');
    const completionDate = await page.locator('#training-completion-date');
    const uploadZone = await page.locator('#training-upload-zone');
    
    if (await modal.isVisible()) {
      console.log('✓ Upload modal is visible');
    } else {
      console.log('✗ Upload modal is not visible');
    }
    
    if (await typeSelect.isVisible()) {
      console.log('✓ Training type select is visible');
      
      // Check if options are loaded
      const options = await page.locator('#training-type-select option').count();
      console.log(`Found ${options} training type options`);
    } else {
      console.log('✗ Training type select is not visible');
    }
    
    if (await completionDate.isVisible()) {
      console.log('✓ Completion date field is visible');
      
      // Check if it has today's date
      const dateValue = await completionDate.inputValue();
      console.log(`Default completion date: ${dateValue}`);
    } else {
      console.log('✗ Completion date field is not visible');
    }
    
    if (await uploadZone.isVisible()) {
      console.log('✓ Upload zone is visible');
    } else {
      console.log('✗ Upload zone is not visible');
    }
    
    // Test form validation - try to submit without required fields
    const saveButton = await page.locator('#training-save-btn');
    if (await saveButton.isVisible()) {
      console.log('✓ Save button is visible');
      
      // Click save without filling required fields
      await saveButton.click();
      await page.waitForTimeout(500);
      
      // Check if error message appears
      const errorDiv = await page.locator('#training-upload-error');
      if (await errorDiv.isVisible()) {
        const errorText = await errorDiv.textContent();
        console.log('✓ Validation error shown:', errorText);
      }
    }
    
    // Fill in a training type if available
    const optionCount = await page.locator('#training-type-select option').count();
    if (optionCount > 1) {
      await typeSelect.selectOption({ index: 1 });
      console.log('Selected first training type');
      
      // Wait for expiry date to be calculated
      await page.waitForTimeout(500);
      
      const expiryDate = await page.locator('#training-expiry-date').inputValue();
      if (expiryDate) {
        console.log('✓ Expiry date calculated automatically:', expiryDate);
      }
    }
    
    // Test closing modal
    const closeButton = await page.locator('#training-modal-close');
    await closeButton.click();
    await page.waitForTimeout(500);
    
    if (!(await modal.isVisible())) {
      console.log('✓ Modal closes correctly');
    } else {
      console.log('✗ Modal did not close');
    }
    
    // Final screenshot
    await page.screenshot({ path: 'test_training_final.png' });
    
    console.log('Training upload test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test_training_error.png' });
  } finally {
    await browser.close();
  }
}

testTrainingUpload();