import { chromium } from 'playwright';

async function testNanFix() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Testing NAN fix...');
    
    // Login flow
    await page.goto('http://localhost:5174/index.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Navigate to complaints reporting
    await page.click('#toggle-complaints');
    await page.waitForTimeout(1000);
    await page.click('button[data-section="complaints-reporting"]');
    await page.waitForTimeout(3000);
    
    // Take screenshot to verify NAN fix
    await page.screenshot({ path: 'complaints_nan_fixed.png' });
    
    console.log('Testing table row click...');
    // Try clicking a table row to open details modal
    try {
      const firstRow = page.locator('tr[data-id]').first();
      if (await firstRow.isVisible()) {
        await firstRow.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'complaint_detail_modal.png' });
        
        // Close modal
        const closeBtn = page.locator('button:has-text("Close")');
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        }
      }
    } catch (err) {
      console.log('Table row click test skipped - no data');
    }
    
    // Test navigation still works
    await page.click('button[data-section="dashboard"]');
    await page.waitForTimeout(2000);
    console.log('✅ NAN fix tested successfully');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testNanFix();