import { chromium } from 'playwright';

async function testInitialState() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing initial state of all three features...\n');
  
  // Login
  console.log('1. Logging in...');
  await page.goto('http://127.0.0.1:5500/index.html');
  await page.waitForTimeout(2000);
  
  // Fill login credentials
  await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
  await page.locator('#password').fill('Hello1!');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(3000);
  
  // Test 1: Training Edit
  console.log('\n2. Testing Training Edit functionality...');
  
  // Open the Checks & Audits group
  await page.click('#toggle-checks');
  await page.waitForTimeout(500);
  
  // Click on Training Tracker
  await page.click('button[data-section="training"]');
  await page.waitForTimeout(2000);
  
  // Try to click on a cell in the training matrix
  const firstCell = await page.locator('.training-matrix td.has-record').first();
  if (await firstCell.count() > 0) {
    await firstCell.click();
    await page.waitForTimeout(1000);
    
    // Check if drawer opens
    const drawer = await page.locator('#cell-drawer.open');
    if (await drawer.count() > 0) {
      console.log('   ✓ Drawer opens');
      
      // Try to click Edit Record button
      const editBtn = await page.locator('button:has-text("Edit Record")');
      if (await editBtn.count() > 0) {
        await editBtn.click();
        await page.waitForTimeout(1000);
        
        // Check if modal opens
        const modal = await page.locator('#training-edit-modal[style*="flex"]');
        if (await modal.count() > 0) {
          console.log('   ✓ Edit modal opens');
          await page.screenshot({ path: 'training_edit_modal.png' });
        } else {
          console.log('   ✗ Edit modal does NOT open');
          await page.screenshot({ path: 'training_edit_failed.png' });
        }
        
        // Close modal if open
        await page.keyboard.press('Escape');
      }
    }
  } else {
    console.log('   ! No training records found to test');
  }
  
  // Test 2: Complaints Edit
  console.log('\n3. Testing Complaints Edit functionality...');
  
  // Open Complaints group
  await page.click('#toggle-complaints');
  await page.waitForTimeout(500);
  
  // Click on Complaints section
  await page.click('button[data-section="complaints"]');
  await page.waitForTimeout(2000);
  
  // Try to click on a complaint row
  const complaintRow = await page.locator('#complaints-tbody tr').first();
  if (await complaintRow.count() > 0) {
    await complaintRow.click();
    await page.waitForTimeout(1000);
    
    // Check if details modal opens
    const detailsModal = await page.locator('#complaint-details-modal');
    if (await detailsModal.count() > 0) {
      console.log('   ✓ Details modal opens');
      
      // Try to click Edit button
      const editBtn = await page.locator('button:has-text("Edit"):visible');
      if (await editBtn.count() > 0) {
        console.log('   Clicking Edit button...');
        await editBtn.click();
        await page.waitForTimeout(2000);
        
        // Check what happens
        const crudModal = await page.locator('#crud-modal[style*="flex"]');
        const detailsStillOpen = await page.locator('#complaint-details-modal:visible');
        
        if (await crudModal.count() > 0) {
          console.log('   ✓ Edit modal opens');
          await page.screenshot({ path: 'complaint_edit_modal.png' });
        } else if (await detailsStillOpen.count() === 0) {
          console.log('   ✗ Details modal closes but edit modal does NOT open');
          await page.screenshot({ path: 'complaint_edit_failed.png' });
        } else {
          console.log('   ✗ Nothing happens');
        }
      }
    }
  } else {
    console.log('   ! No complaints found to test');
  }
  
  // Test 3: Excel Export
  console.log('\n4. Testing Excel Export functionality...');
  
  // Check Training Export
  await page.click('#toggle-checks');
  await page.waitForTimeout(500);
  await page.click('button[data-section="training"]');
  await page.waitForTimeout(1000);
  
  const trainingExportBtn = await page.locator('button:has-text("Export"):visible');
  if (await trainingExportBtn.count() > 0) {
    console.log('   ✓ Training export button exists');
    
    // Test export functionality
    await trainingExportBtn.click();
    await page.waitForTimeout(1000);
    console.log('   Clicked export - check if CSV downloads');
  } else {
    console.log('   ✗ Training export button NOT found');
  }
  
  // Check Complaints Export
  await page.click('#toggle-complaints');
  await page.waitForTimeout(500);
  await page.click('button[data-section="complaints"]');
  await page.waitForTimeout(1000);
  
  const complaintsExportBtn = await page.locator('button:has-text("Export"):visible');
  if (await complaintsExportBtn.count() > 0) {
    console.log('   ✓ Complaints export button exists');
    
    // Test export functionality
    await complaintsExportBtn.click();
    await page.waitForTimeout(1000);
    console.log('   Clicked export - check if CSV downloads');
  } else {
    console.log('   ✗ Complaints export button NOT found');
  }
  
  await page.screenshot({ path: 'initial_state_test.png', fullPage: true });
  console.log('\nScreenshot saved as initial_state_test.png');
  
  await browser.close();
  console.log('\nTest complete!');
}

testInitialState().catch(console.error);