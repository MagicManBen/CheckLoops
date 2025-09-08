import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function testAllFixes() {
  const browser = await chromium.launch({ 
    headless: false,
    downloadsPath: './'  // Set download path for Excel files
  });
  const context = await browser.newContext({
    acceptDownloads: true
  });
  const page = await context.newPage();
  
  console.log('🔍 Testing all three fixes...\n');
  
  // Login
  console.log('1. Logging in...');
  await page.goto('http://127.0.0.1:5500/index.html');
  await page.waitForTimeout(2000);
  
  await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
  await page.locator('#password').fill('Hello1!');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(3000);
  
  // Test 1: Training Edit Modal
  console.log('\n📚 TEST 1: Training Edit Functionality');
  console.log('----------------------------------------');
  
  // Navigate to Training
  await page.click('#toggle-checks');
  await page.waitForTimeout(500);
  await page.click('button[data-section="training"]');
  await page.waitForTimeout(2000);
  
  // Click on a training cell with data
  const hasRecordCell = await page.locator('.training-matrix td.has-record, .training-matrix td[style*="background"]').first();
  
  if (await hasRecordCell.count() > 0) {
    await hasRecordCell.click();
    await page.waitForTimeout(1500);
    
    // Check if drawer opens
    const drawer = await page.locator('#cell-drawer.open');
    if (await drawer.count() > 0) {
      console.log('   ✅ Training drawer opens');
      
      // Click Edit Record
      const editBtn = await page.locator('button:has-text("Edit Record")');
      if (await editBtn.count() > 0) {
        await editBtn.click();
        await page.waitForTimeout(1500);
        
        // Check if modal opens
        const modal = await page.locator('#training-edit-modal[style*="flex"], #training-edit-modal:visible');
        if (await modal.count() > 0) {
          console.log('   ✅ Training edit modal OPENS successfully!');
          
          // Check if form fields are populated
          const staffName = await page.locator('#training-edit-staff-name').inputValue();
          const typeName = await page.locator('#training-edit-type-name').inputValue();
          
          if (staffName && typeName) {
            console.log(`   ✅ Form populated: ${staffName} - ${typeName}`);
          }
          
          await page.screenshot({ path: 'training_edit_success.png' });
          
          // Close modal
          await page.click('button:has-text("Cancel"):visible, .close-btn:visible');
          await page.waitForTimeout(500);
        } else {
          console.log('   ❌ Training edit modal does NOT open');
          await page.screenshot({ path: 'training_edit_failed.png' });
        }
      }
    }
  } else {
    console.log('   ⚠️  No training records found to test');
  }
  
  // Test 2: Complaints Edit Modal
  console.log('\n📝 TEST 2: Complaints Edit Functionality');
  console.log('----------------------------------------');
  
  // Navigate to Complaints
  await page.click('#toggle-complaints');
  await page.waitForTimeout(500);
  await page.click('button[data-section="complaints-reporting"]');
  await page.waitForTimeout(2000);
  
  // Click on a complaint row
  const complaintRow = await page.locator('#complaints-tbody tr').first();
  
  if (await complaintRow.count() > 0) {
    await complaintRow.click();
    await page.waitForTimeout(1500);
    
    // Check if details modal opens
    const detailsModal = await page.locator('#complaint-details-modal, #complaint-detail-modal');
    if (await detailsModal.count() > 0) {
      console.log('   ✅ Complaint details modal opens');
      
      // Click Edit button
      const editBtn = await page.locator('button:has-text("Edit"):visible');
      if (await editBtn.count() > 0) {
        console.log('   Clicking Edit button...');
        await editBtn.click();
        await page.waitForTimeout(2000);
        
        // Check if CRUD modal opens
        const crudModal = await page.locator('#crud-modal.show, #crud-modal[style*="flex"]');
        const crudTitle = await page.locator('#crud-title:has-text("Complaint")');
        
        if (await crudModal.count() > 0 || await crudTitle.count() > 0) {
          console.log('   ✅ Complaint edit modal OPENS successfully!');
          
          // Check if form is populated
          const patientField = await page.locator('#field-patient_initials, input[name="patient_initials"]').first();
          if (await patientField.count() > 0) {
            const value = await patientField.inputValue();
            if (value) {
              console.log(`   ✅ Form populated with patient: ${value}`);
            }
          }
          
          await page.screenshot({ path: 'complaint_edit_success.png' });
          
          // Close modal
          await page.click('#crud-cancel, button:has-text("Cancel"):visible');
          await page.waitForTimeout(500);
        } else {
          console.log('   ❌ Complaint edit modal does NOT open');
          const detailsStillOpen = await page.locator('#complaint-details-modal:visible, #complaint-detail-modal:visible');
          if (await detailsStillOpen.count() === 0) {
            console.log('   ❌ Details modal closed but edit modal did not open');
          }
          await page.screenshot({ path: 'complaint_edit_failed.png' });
        }
      }
    }
  } else {
    console.log('   ⚠️  No complaints found to test');
  }
  
  // Test 3: Excel Export with Formatting
  console.log('\n📊 TEST 3: Excel Export Functionality');
  console.log('----------------------------------------');
  
  // Test Training Export
  await page.click('#toggle-checks');
  await page.waitForTimeout(500);
  await page.click('button[data-section="training"]');
  await page.waitForTimeout(1500);
  
  const trainingExportBtn = await page.locator('button:has-text("Export"):visible').first();
  if (await trainingExportBtn.count() > 0) {
    console.log('   ✅ Training export button found');
    
    // Handle download
    const downloadPromise = page.waitForEvent('download');
    await trainingExportBtn.click();
    
    try {
      const download = await downloadPromise;
      const fileName = download.suggestedFilename();
      
      if (fileName.endsWith('.xlsx')) {
        console.log(`   ✅ Excel file generated: ${fileName}`);
        
        // Save the file
        await download.saveAs(`./test_downloads/${fileName}`);
        console.log('   ✅ Training Excel file downloaded with .xlsx extension');
      } else {
        console.log(`   ❌ Wrong file format: ${fileName}`);
      }
    } catch (e) {
      console.log('   ⚠️  Download event not triggered or timed out');
    }
  }
  
  // Test Complaints Export
  await page.click('#toggle-complaints');
  await page.waitForTimeout(500);
  await page.click('button[data-section="complaints-reporting"]');
  await page.waitForTimeout(1500);
  
  const complaintsExportBtn = await page.locator('button:has-text("Export"):visible').first();
  if (await complaintsExportBtn.count() > 0) {
    console.log('   ✅ Complaints export button found');
    
    // Handle download
    const downloadPromise = page.waitForEvent('download');
    await complaintsExportBtn.click();
    
    try {
      const download = await downloadPromise;
      const fileName = download.suggestedFilename();
      
      if (fileName.endsWith('.xlsx')) {
        console.log(`   ✅ Excel file generated: ${fileName}`);
        
        // Save the file
        await download.saveAs(`./test_downloads/${fileName}`);
        console.log('   ✅ Complaints Excel file downloaded with .xlsx extension');
      } else {
        console.log(`   ❌ Wrong file format: ${fileName}`);
      }
    } catch (e) {
      console.log('   ⚠️  Download event not triggered or timed out');
    }
  }
  
  // Final screenshot
  await page.screenshot({ path: 'all_tests_complete.png', fullPage: true });
  
  console.log('\n========================================');
  console.log('📋 TEST SUMMARY');
  console.log('========================================');
  console.log('1. Training Edit Modal: Check screenshots');
  console.log('2. Complaint Edit Modal: Check screenshots'); 
  console.log('3. Excel Export: Check test_downloads folder');
  console.log('\nScreenshots saved:');
  console.log('  - training_edit_success/failed.png');
  console.log('  - complaint_edit_success/failed.png');
  console.log('  - all_tests_complete.png');
  
  await browser.close();
  console.log('\n✅ All tests completed!');
}

// Create downloads directory if it doesn't exist
if (!fs.existsSync('./test_downloads')) {
  fs.mkdirSync('./test_downloads');
}

testAllFixes().catch(console.error);