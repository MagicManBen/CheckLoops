import { chromium } from 'playwright';

async function testAllFixes() {
  console.log('Testing all fixes on live site...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to live site
    console.log('1. Opening site...');
    await page.goto('https://magicmanben.github.io/CheckLoops/');
    await page.waitForTimeout(2000);
    
    // Login
    console.log('2. Logging in...');
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // TEST 1: Training Matrix Edit
    console.log('\n=== TEST 1: Training Matrix Edit ===');
    
    // Expand the Checks nav group if collapsed
    const checksToggle = page.locator('#toggle-checks');
    const isExpanded = await checksToggle.getAttribute('aria-expanded');
    if (isExpanded === 'false') {
      console.log('Expanding Checks group...');
      await checksToggle.click();
      await page.waitForTimeout(500);
    }
    
    // Click Training Tracker
    await page.click('button[data-section="training"]');
    await page.waitForTimeout(2000);
    
    // Find and click a training cell
    const trainingCells = await page.locator('.training-cell').all();
    console.log(`Found ${trainingCells.length} training cells`);
    
    if (trainingCells.length > 0) {
      // Test with 3 different cells
      for (let i = 0; i < Math.min(3, trainingCells.length); i++) {
        console.log(`\nTesting cell ${i + 1}...`);
        await trainingCells[i].click();
        await page.waitForTimeout(1000);
        
        // Check if drawer opened
        const drawerVisible = await page.locator('#cell-drawer.open').count() > 0;
        console.log(`  Drawer opened: ${drawerVisible}`);
        
        if (drawerVisible) {
          // Look for Edit Report button
          const editButton = page.locator('#cell-drawer button:has-text("Edit Report")');
          const editExists = await editButton.count() > 0;
          console.log(`  Edit button exists: ${editExists}`);
          
          if (editExists) {
            await editButton.click();
            await page.waitForTimeout(1000);
            
            // Check if training modal opened
            const modalVisible = await page.locator('#training-modal').isVisible();
            console.log(`  Training modal opened: ${modalVisible}`);
            
            if (modalVisible) {
              // Close modal
              const closeBtn = page.locator('#training-modal button:has-text("Cancel"), #training-modal button:has-text("Close")');
              if (await closeBtn.count() > 0) {
                await closeBtn.first().click();
                await page.waitForTimeout(500);
              }
            }
          }
          
          // Close drawer
          const closeDrawer = page.locator('#cell-drawer button:has-text("×"), #cell-drawer .close-btn');
          if (await closeDrawer.count() > 0) {
            await closeDrawer.first().click();
            await page.waitForTimeout(500);
          }
        }
      }
    }
    
    // TEST 2: Complaints Edit
    console.log('\n=== TEST 2: Complaints Edit ===');
    
    // Navigate to Complaints
    const complaintsToggle = page.locator('#toggle-complaints');
    const isComplaintsExpanded = await complaintsToggle.getAttribute('aria-expanded');
    if (isComplaintsExpanded === 'false') {
      console.log('Expanding Complaints group...');
      await complaintsToggle.click();
      await page.waitForTimeout(500);
    }
    
    await page.click('button[data-section="complaints-reporting"]');
    await page.waitForTimeout(2000);
    
    // Test complaint rows
    const complaintRows = await page.locator('#complaints-tbody tr').all();
    console.log(`Found ${complaintRows.length} complaint rows`);
    
    if (complaintRows.length > 0) {
      // Test with 3 different rows
      for (let i = 0; i < Math.min(3, complaintRows.length); i++) {
        console.log(`\nTesting complaint ${i + 1}...`);
        await complaintRows[i].click();
        await page.waitForTimeout(1500);
        
        // Check if complaint details modal opened (it may be dynamically created)
        const detailsModal = page.locator('#complaint-detail-modal.show');
        const detailsModalVisible = await detailsModal.count() > 0;
        console.log(`  Details modal opened: ${detailsModalVisible}`);
        
        if (detailsModalVisible) {
          // Look for Edit button in the modal
          const editComplaintBtn = page.locator('#complaint-detail-modal button:has-text("Edit")');
          const editBtnExists = await editComplaintBtn.count() > 0;
          console.log(`  Edit button exists: ${editBtnExists}`);
          
          if (editBtnExists) {
            await editComplaintBtn.click();
            await page.waitForTimeout(1000);
            
            // Check if CRUD modal opened
            const crudModalVisible = await page.locator('#crud-modal').isVisible();
            console.log(`  CRUD modal opened: ${crudModalVisible}`);
            
            if (crudModalVisible) {
              // Close CRUD modal
              const closeCrud = page.locator('#crud-modal button:has-text("Cancel"), #crud-modal .close-btn');
              if (await closeCrud.count() > 0) {
                await closeCrud.first().click();
                await page.waitForTimeout(500);
              }
            }
          }
          
          // Close details modal
          const closeDetails = page.locator('#complaint-detail-modal button:has-text("Close"), #complaint-detail-modal .modal-close');
          if (await closeDetails.count() > 0) {
            await closeDetails.first().click();
            await page.waitForTimeout(500);
          }
        }
      }
    }
    
    // TEST 3: Excel Export
    console.log('\n=== TEST 3: Excel Export ===');
    
    // Check if SheetJS is loaded
    const hasXLSX = await page.evaluate(() => typeof XLSX !== 'undefined');
    console.log(`SheetJS library loaded: ${hasXLSX}`);
    
    if (!hasXLSX) {
      console.log('SheetJS not loaded, checking script tag...');
      const scriptTags = await page.locator('script[src*="xlsx"]').all();
      console.log(`Found ${scriptTags.length} SheetJS script tags`);
    }
    
    // Test export from complaints page
    const exportBtn = page.locator('#complaints-section button:has-text("Export")');
    const exportExists = await exportBtn.count() > 0;
    console.log(`Export button in complaints: ${exportExists}`);
    
    if (exportExists) {
      // Intercept download
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportBtn.click();
      const download = await downloadPromise;
      
      if (download) {
        const filename = download.suggestedFilename();
        console.log(`  Download triggered: ${filename}`);
        console.log(`  Is Excel file: ${filename.endsWith('.xlsx')}`);
      } else {
        console.log('  No download triggered');
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test_results.png', fullPage: true });
    console.log('\n✅ Tests completed. Screenshot saved as test_results.png');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    await page.screenshot({ path: 'test_error.png' });
  } finally {
    console.log('\nKeeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testAllFixes();