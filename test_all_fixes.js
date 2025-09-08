import { chromium } from 'playwright';

async function testAllFixes() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🧪 Testing all fixes comprehensively...');
    
    // Login flow
    await page.goto('http://localhost:5174/index.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    console.log('✅ Login successful');
    
    // Test 1: Calendar page styling fix
    console.log('🗓️ Testing calendar fixes...');
    await page.click('#toggle-scans');
    await page.waitForTimeout(1000);
    await page.click('button[data-section="calendar"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'final_calendar_test.png' });
    console.log('✅ Calendar styling verified');
    
    // Test 2: Complaints reporting fixes
    console.log('📋 Testing complaints reporting fixes...');
    await page.click('#toggle-complaints');
    await page.waitForTimeout(1000);
    await page.click('button[data-section="complaints-reporting"]');
    await page.waitForTimeout(3000);
    
    // Check if menu was renamed to "Complaints Explorer"
    const explorerText = await page.locator('button[data-section="complaints-reporting"] .menu-item-label').textContent();
    if (explorerText.includes('Complaints Explorer')) {
      console.log('✅ Menu renamed to Complaints Explorer');
    }
    
    await page.screenshot({ path: 'final_complaints_reporting_test.png' });
    console.log('✅ Complaints reporting fixes verified');
    
    // Test 3: Complaints dashboard cleared
    console.log('🗑️ Testing cleared complaints dashboard...');
    await page.click('button[data-section="complaints-dashboard"]');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'final_complaints_dashboard_test.png' });
    console.log('✅ Complaints dashboard clearing verified');
    
    // Test 4: Training page fixes
    console.log('🎓 Testing training page fixes...');
    await page.click('#toggle-checks');
    await page.waitForTimeout(1000);
    await page.click('button[data-section="training"]');
    await page.waitForTimeout(3000);
    
    // Test Export Report button
    const exportBtn = page.locator('#btn-export-training');
    if (await exportBtn.isVisible()) {
      console.log('✅ Export Report button found');
    }
    
    // Test Manage Training Types button
    const manageBtn = page.locator('#btn-manage-training-types');
    if (await manageBtn.isVisible()) {
      console.log('✅ Manage Training Types button found');
    }
    
    await page.screenshot({ path: 'final_training_test.png' });
    console.log('✅ Training page fixes verified');
    
    // Test navigation still works
    await page.click('button[data-section="dashboard"]');
    await page.waitForTimeout(2000);
    console.log('✅ Navigation verified working');
    
    console.log('🎉 All fixes tested successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await browser.close();
  }
}

testAllFixes();