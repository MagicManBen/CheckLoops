import { chromium } from 'playwright';

async function testFeatures() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500  // Slow down actions to see what's happening
  });
  
  const context = await browser.newContext({
    acceptDownloads: true
  });
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error') {
      console.log('Browser console:', msg.text());
    }
  });
  
  console.log('🔍 Testing features individually...\n');
  
  // Login
  console.log('1. Logging in...');
  await page.goto('http://127.0.0.1:5500/index.html');
  await page.waitForTimeout(2000);
  
  await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
  await page.locator('#password').fill('Hello1!');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(3000);
  
  console.log('✅ Logged in successfully\n');
  
  // Test Complaints Edit
  console.log('2. Testing Complaints Edit...');
  console.log('   Opening Complaints section...');
  
  // Try to find and click the complaints toggle
  const complaintsToggle = await page.locator('#toggle-complaints').first();
  if (await complaintsToggle.count() > 0) {
    await complaintsToggle.click();
    await page.waitForTimeout(1000);
  }
  
  // Look for any complaints-related button
  const complaintsBtn = await page.locator('button[data-section*="complaint"]:visible').first();
  if (await complaintsBtn.count() > 0) {
    const sectionName = await complaintsBtn.getAttribute('data-section');
    console.log(`   Found complaints button: ${sectionName}`);
    await complaintsBtn.click();
    await page.waitForTimeout(2000);
  }
  
  // Check if there are complaints in the table
  const complaintRows = await page.locator('#complaints-tbody tr, .complaints-table tbody tr').all();
  console.log(`   Found ${complaintRows.length} complaint rows`);
  
  if (complaintRows.length > 0) {
    // Click the first complaint
    await complaintRows[0].click();
    await page.waitForTimeout(2000);
    
    // Look for the Edit button in the modal
    const editBtn = await page.locator('button:has-text("Edit"):visible').first();
    if (await editBtn.count() > 0) {
      console.log('   Clicking Edit button...');
      await editBtn.click();
      await page.waitForTimeout(3000);
      
      // Check if CRUD modal opened
      const crudModal = await page.locator('#crud-modal.show, #crud-modal:visible').first();
      const crudTitle = await page.locator('#crud-title:visible').first();
      
      if (await crudModal.count() > 0) {
        const titleText = await crudTitle.textContent();
        console.log(`   ✅ CRUD Modal opened! Title: ${titleText}`);
        await page.screenshot({ path: 'complaint_edit_working.png' });
        
        // Close the modal
        await page.click('#crud-cancel');
      } else {
        console.log('   ❌ CRUD Modal did not open');
        await page.screenshot({ path: 'complaint_edit_not_working.png' });
      }
    } else {
      console.log('   ❌ Edit button not found');
    }
  }
  
  // Test Excel Export
  console.log('\n3. Testing Excel Export...');
  
  // Try training export
  const checksToggle = await page.locator('#toggle-checks').first();
  if (await checksToggle.count() > 0) {
    await checksToggle.click();
    await page.waitForTimeout(1000);
  }
  
  const trainingBtn = await page.locator('button[data-section="training"]:visible').first();
  if (await trainingBtn.count() > 0) {
    await trainingBtn.click();
    await page.waitForTimeout(2000);
    
    const exportBtn = await page.locator('button:has-text("Export"):visible').first();
    if (await exportBtn.count() > 0) {
      console.log('   Found Export button, clicking...');
      
      // Set up download handler
      page.once('download', async download => {
        const filename = download.suggestedFilename();
        console.log(`   📥 Download triggered: ${filename}`);
        
        if (filename.endsWith('.xlsx')) {
          console.log('   ✅ Excel format (.xlsx) confirmed!');
        } else {
          console.log(`   ❌ Wrong format: ${filename}`);
        }
      });
      
      await exportBtn.click();
      await page.waitForTimeout(2000);
    }
  }
  
  console.log('\n4. Taking final screenshot...');
  await page.screenshot({ path: 'final_state.png', fullPage: true });
  
  console.log('\n✅ Test complete! Check the screenshots and console output above.');
  console.log('\nLeaving browser open for manual inspection...');
  console.log('Close the browser window when done.');
  
  // Keep browser open for manual inspection
  await page.waitForTimeout(300000); // 5 minutes
}

testFeatures().catch(console.error);