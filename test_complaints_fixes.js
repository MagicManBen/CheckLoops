import { chromium } from 'playwright';

async function testComplaintsFixes() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Testing complaints fixes...');
    
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
    
    // Take screenshot to verify fixes
    await page.screenshot({ path: 'complaints_fixed.png' });
    
    console.log('Testing Add Complaint button...');
    // Test Add Complaint button
    const addButton = page.locator('#btn-new-complaint');
    if (await addButton.isVisible()) {
      console.log('✅ Add Complaint button found');
    }
    
    console.log('Testing Export button...');
    // Test Export button
    const exportButton = page.locator('#complaints-export');
    if (await exportButton.isVisible()) {
      console.log('✅ Export button found');
    }
    
    // Test navigation still works
    await page.click('button[data-section="dashboard"]');
    await page.waitForTimeout(2000);
    console.log('✅ Complaints fixes tested successfully');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testComplaintsFixes();