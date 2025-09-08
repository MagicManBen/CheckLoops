import { chromium } from 'playwright';

async function testAllWorking() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 200
  });
  
  const context = await browser.newContext({
    acceptDownloads: true
  });
  const page = await context.newPage();
  
  // Only log relevant console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('adding show class') || text.includes('CRUD modal') || text.includes('Error')) {
      console.log('Debug:', text);
    }
  });
  
  console.log('🔍 FINAL TEST - ALL THREE FEATURES\n');
  console.log('=====================================\n');
  
  // Login
  await page.goto('http://127.0.0.1:5500/index.html');
  await page.waitForTimeout(2000);
  await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
  await page.locator('#password').fill('Hello1!');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(4000);
  console.log('✅ Logged in\n');
  
  // TEST 1: COMPLAINT EDIT
  console.log('TEST 1: Complaint Edit Modal');
  await page.click('#toggle-complaints');
  await page.waitForTimeout(500);
  await page.click('button[data-section="complaints-reporting"]');
  await page.waitForTimeout(2500);
  
  const firstRow = await page.locator('#complaints-tbody tr').first();
  if (await firstRow.count() > 0) {
    await firstRow.click();
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Edit"):visible');
    await page.waitForTimeout(2000);
    
    const modalVisible = await page.locator('#crud-modal.show').count() > 0;
    if (modalVisible) {
      console.log('✅ Complaint Edit Modal WORKS!');
      await page.screenshot({ path: 'complaint_edit_success.png' });
      await page.click('#crud-cancel');
    } else {
      console.log('❌ Complaint Edit Modal FAILED');
    }
  }
  
  // TEST 2: TRAINING EDIT  
  console.log('\nTEST 2: Training Edit Modal');
  await page.click('#toggle-checks');
  await page.waitForTimeout(500);
  await page.click('button[data-section="training"]');
  await page.waitForTimeout(2500);
  
  // Look for any cell with text indicating training data
  const trainingCell = await page.locator('.training-matrix td').filter({ hasText: /Complete|Expired|Due|days/ }).first();
  
  if (await trainingCell.count() > 0) {
    await trainingCell.click();
    await page.waitForTimeout(1500);
    
    const drawer = await page.locator('#cell-drawer.open');
    if (await drawer.count() > 0) {
      const editBtn = await page.locator('button:has-text("Edit Record")');
      if (await editBtn.count() > 0) {
        await editBtn.click();
        await page.waitForTimeout(1500);
        
        const modalVisible = await page.locator('#training-edit-modal[style*="flex"], #training-edit-modal:visible').count() > 0;
        if (modalVisible) {
          console.log('✅ Training Edit Modal WORKS!');
          await page.screenshot({ path: 'training_edit_success.png' });
          await page.keyboard.press('Escape');
        } else {
          console.log('❌ Training Edit Modal FAILED');
        }
      }
    }
  } else {
    console.log('⚠️  No training data found');
  }
  
  // TEST 3: EXCEL EXPORT
  console.log('\nTEST 3: Excel Export');
  const exportBtn = await page.locator('button:has-text("Export"):visible').first();
  if (await exportBtn.count() > 0) {
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await exportBtn.click();
    
    const download = await downloadPromise;
    if (download) {
      const filename = download.suggestedFilename();
      if (filename.endsWith('.xlsx')) {
        console.log('✅ Excel Export WORKS! (.xlsx format)');
      } else {
        console.log('❌ Wrong format:', filename);
      }
    }
  }
  
  console.log('\n=====================================');
  console.log('📊 SUMMARY:');
  console.log('=====================================');
  console.log('Check the screenshots:');
  console.log('- complaint_edit_success.png');
  console.log('- training_edit_success.png');
  
  await page.waitForTimeout(2000);
  await browser.close();
}

testAllWorking().catch(console.error);