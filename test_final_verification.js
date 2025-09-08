import { chromium } from 'playwright';

async function finalVerification() {
  console.log('🚀 FINAL VERIFICATION OF ALL THREE FIXES\n');
  console.log('=========================================\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 200
  });
  
  const context = await browser.newContext({
    acceptDownloads: true
  });
  const page = await context.newPage();
  
  // Monitor console for debugging info
  page.on('console', msg => {
    if (msg.text().includes('editComplaint') || msg.text().includes('CRUD') || msg.text().includes('Complaint data')) {
      console.log('📋 Debug:', msg.text());
    }
  });
  
  try {
    // LOGIN
    console.log('Step 1: Login');
    await page.goto('http://127.0.0.1:5500/index.html');
    await page.waitForTimeout(2000);
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(4000);
    console.log('✅ Logged in\n');
    
    // TEST 1: COMPLAINT EDIT
    console.log('TEST 1: COMPLAINT EDIT MODAL');
    console.log('-----------------------------');
    
    // Navigate to complaints
    await page.click('#toggle-complaints');
    await page.waitForTimeout(500);
    
    // Click on Complaints Explorer (complaints-reporting)
    await page.click('button[data-section="complaints-reporting"]');
    await page.waitForTimeout(2500);
    
    // Click first complaint row
    const firstRow = await page.locator('#complaints-tbody tr').first();
    if (await firstRow.count() > 0) {
      const complaintText = await firstRow.textContent();
      console.log(`Found complaint: ${complaintText.substring(0, 50)}...`);
      
      await firstRow.click();
      await page.waitForTimeout(2000);
      
      // Click Edit button
      const editBtn = await page.locator('button:has-text("Edit"):visible');
      if (await editBtn.count() > 0) {
        console.log('Clicking Edit button...');
        await editBtn.click();
        await page.waitForTimeout(3000);
        
        // Check if CRUD modal is visible
        const crudVisible = await page.locator('#crud-modal.show, #crud-modal:visible').count() > 0;
        const crudTitle = await page.locator('#crud-title:visible').textContent().catch(() => '');
        
        if (crudVisible && crudTitle.includes('Complaint')) {
          console.log('✅ COMPLAINT EDIT MODAL WORKS! Modal is visible');
          await page.screenshot({ path: 'SUCCESS_complaint_edit.png' });
          
          // Close modal
          await page.click('#crud-cancel');
          await page.waitForTimeout(1000);
        } else {
          console.log('❌ COMPLAINT EDIT MODAL FAILED - Modal not visible');
          await page.screenshot({ path: 'FAILED_complaint_edit.png' });
        }
      }
    } else {
      console.log('⚠️  No complaints to test');
    }
    
    // TEST 2: TRAINING EDIT
    console.log('\nTEST 2: TRAINING EDIT MODAL');
    console.log('-----------------------------');
    
    // Navigate to training
    await page.click('#toggle-checks');
    await page.waitForTimeout(500);
    await page.click('button[data-section="training"]');
    await page.waitForTimeout(2500);
    
    // Find a cell with training data
    const cellWithData = await page.locator('.training-matrix td').filter({ hasText: /Complete|Expired|Due/ }).first();
    
    if (await cellWithData.count() > 0) {
      const cellText = await cellWithData.textContent();
      console.log(`Found training cell: ${cellText}`);
      
      await cellWithData.click();
      await page.waitForTimeout(1500);
      
      // Check if drawer opened
      const drawer = await page.locator('#cell-drawer.open');
      if (await drawer.count() > 0) {
        console.log('Training drawer opened');
        
        // Click Edit Record
        const editBtn = await page.locator('button:has-text("Edit Record")');
        if (await editBtn.count() > 0) {
          await editBtn.click();
          await page.waitForTimeout(1500);
          
          // Check if training edit modal is visible
          const modalVisible = await page.locator('#training-edit-modal[style*="flex"], #training-edit-modal:visible').count() > 0;
          
          if (modalVisible) {
            console.log('✅ TRAINING EDIT MODAL WORKS! Modal is visible');
            await page.screenshot({ path: 'SUCCESS_training_edit.png' });
            
            // Close modal
            const closeBtn = await page.locator('.close-btn:visible, button:has-text("Cancel"):visible').first();
            await closeBtn.click();
            await page.waitForTimeout(1000);
          } else {
            console.log('❌ TRAINING EDIT MODAL FAILED - Modal not visible');
            await page.screenshot({ path: 'FAILED_training_edit.png' });
          }
        }
      }
    } else {
      console.log('⚠️  No training data to test');
    }
    
    // TEST 3: EXCEL EXPORT
    console.log('\nTEST 3: EXCEL EXPORT');
    console.log('--------------------');
    
    // Still on training page, test export
    const exportBtn = await page.locator('button:has-text("Export"):visible').first();
    if (await exportBtn.count() > 0) {
      console.log('Found Export button');
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportBtn.click();
      
      const download = await downloadPromise;
      if (download) {
        const filename = download.suggestedFilename();
        console.log(`Download triggered: ${filename}`);
        
        if (filename.endsWith('.xlsx')) {
          console.log('✅ EXCEL EXPORT WORKS! File is .xlsx format');
          
          // Check file features by saving it
          const buffer = await download.createReadStream();
          console.log('Excel file downloaded successfully');
        } else {
          console.log('❌ EXCEL EXPORT FAILED - Wrong format:', filename);
        }
      } else {
        console.log('⚠️  No download triggered');
      }
    }
    
    console.log('\n=========================================');
    console.log('📊 FINAL RESULTS:');
    console.log('=========================================');
    console.log('1. Complaint Edit Modal: Check SUCCESS_complaint_edit.png');
    console.log('2. Training Edit Modal: Check SUCCESS_training_edit.png');
    console.log('3. Excel Export: Check if .xlsx file downloads');
    console.log('\nAll screenshots saved in current directory.');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

finalVerification().catch(console.error);