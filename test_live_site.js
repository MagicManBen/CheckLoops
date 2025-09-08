import { chromium } from 'playwright';

async function testLiveSite() {
  console.log('Testing live site functionality...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Test the GitHub Pages live site
    console.log('\n1. Testing GitHub Pages site...');
    await page.goto('https://magicmanben.github.io/CheckLoops/');
    await page.waitForTimeout(2000);
    
    // Login
    console.log('Logging in...');
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Test 1: Training Matrix Edit
    console.log('\n2. Testing Training Matrix...');
    await page.click('button[data-section="training"]');
    await page.waitForTimeout(2000);
    
    // Click on a training cell to open drawer
    const trainingCells = await page.locator('.training-cell').all();
    if (trainingCells.length > 0) {
      console.log(`Found ${trainingCells.length} training cells`);
      await trainingCells[0].click();
      await page.waitForTimeout(1000);
      
      // Check if drawer opened
      const drawerVisible = await page.locator('#cell-drawer').isVisible();
      console.log(`Training drawer visible: ${drawerVisible}`);
      
      // Look for edit button
      const editButton = page.locator('button:has-text("Edit Report")');
      const editButtonExists = await editButton.count() > 0;
      console.log(`Edit button exists: ${editButtonExists}`);
      
      if (editButtonExists) {
        await editButton.click();
        await page.waitForTimeout(1000);
        
        // Check if modal opened
        const modalVisible = await page.locator('#training-modal').isVisible();
        console.log(`Training modal opened: ${modalVisible}`);
      }
    }
    
    // Test 2: Complaints Edit
    console.log('\n3. Testing Complaints...');
    await page.click('button[data-section="complaints"]');
    await page.waitForTimeout(2000);
    
    // Click on a complaint row
    const complaintRows = await page.locator('#complaints-tbody tr').all();
    if (complaintRows.length > 0) {
      console.log(`Found ${complaintRows.length} complaint rows`);
      await complaintRows[0].click();
      await page.waitForTimeout(1000);
      
      // Check if complaint details modal opened
      const complaintModalVisible = await page.locator('#complaint-details-modal').isVisible();
      console.log(`Complaint modal visible: ${complaintModalVisible}`);
      
      if (complaintModalVisible) {
        const editComplaintBtn = page.locator('button:has-text("Edit Complaint")');
        const editComplaintExists = await editComplaintBtn.count() > 0;
        console.log(`Edit complaint button exists: ${editComplaintExists}`);
        
        if (editComplaintExists) {
          await editComplaintBtn.click();
          await page.waitForTimeout(1000);
          
          // Check if CRUD modal opened
          const crudModalVisible = await page.locator('#crud-modal').isVisible();
          console.log(`CRUD modal opened: ${crudModalVisible}`);
        }
      }
    }
    
    // Test 3: Excel Export
    console.log('\n4. Testing Excel Export...');
    const exportButton = page.locator('button:has-text("Export")').first();
    const exportExists = await exportButton.count() > 0;
    console.log(`Export button exists: ${exportExists}`);
    
    // Check if SheetJS is loaded
    const hasXLSX = await page.evaluate(() => typeof XLSX !== 'undefined');
    console.log(`SheetJS library loaded: ${hasXLSX}`);
    
    // Take screenshot
    await page.screenshot({ path: 'live_site_test.png', fullPage: true });
    console.log('\nScreenshot saved as live_site_test.png');
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
}

testLiveSite();