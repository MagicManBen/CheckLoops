import { chromium } from 'playwright';

async function testActualIssues() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Testing actual issues...');
    
    // Login
    await page.goto('http://localhost:5173/index.html');
    await page.waitForTimeout(2000);
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Test 1: Complaints filters
    console.log('\n1. Testing complaints filters...');
    await page.click('#toggle-complaints');
    await page.waitForTimeout(1000);
    await page.click('button[data-section="complaints-reporting"]');
    await page.waitForTimeout(3000);
    
    // Try changing category filter
    const categorySelect = page.locator('#complaints-filter-category');
    if (await categorySelect.isVisible()) {
      const options = await categorySelect.locator('option').count();
      console.log(`   Category dropdown has ${options} options`);
      if (options > 1) {
        await categorySelect.selectOption({ index: 1 });
        await page.waitForTimeout(2000);
        console.log('   Selected a category - checking if table updates...');
      }
    }
    
    // Test 2: Click complaint row
    console.log('\n2. Testing complaint row click...');
    const firstRow = page.locator('tr[data-id]').first();
    if (await firstRow.isVisible()) {
      console.log('   Clicking first complaint row...');
      await firstRow.click();
      await page.waitForTimeout(2000);
      
      // Check if modal opened
      const modal = page.locator('#complaint-detail-modal.show');
      if (await modal.isVisible()) {
        console.log('   ✅ Modal opened!');
        await page.screenshot({ path: 'complaint_modal_test.png' });
      } else {
        console.log('   ❌ Modal did NOT open');
      }
    }
    
    // Test 3: Training cell click
    console.log('\n3. Testing training cell click...');
    await page.click('#toggle-checks');
    await page.waitForTimeout(1000);
    await page.click('button[data-section="training"]');
    await page.waitForTimeout(3000);
    
    // Switch to non-clinical tab
    await page.click('#tab-non-clinical');
    await page.waitForTimeout(2000);
    
    // Try to find and click a training cell
    const trainingCells = page.locator('.training-cell');
    const cellCount = await trainingCells.count();
    console.log(`   Found ${cellCount} training cells`);
    
    if (cellCount > 0) {
      console.log('   Clicking first training cell...');
      await trainingCells.first().click();
      await page.waitForTimeout(2000);
      
      // Check if drawer opened
      const drawer = page.locator('#cell-drawer.open');
      if (await drawer.isVisible()) {
        console.log('   ✅ Drawer opened!');
        await page.screenshot({ path: 'training_drawer_test.png' });
      } else {
        console.log('   ❌ Drawer did NOT open');
      }
    }
    
    console.log('\nTest complete - check results above');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Keep browser open for manual inspection
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testActualIssues();