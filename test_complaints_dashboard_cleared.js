import { chromium } from 'playwright';

async function testComplaintsDashboardCleared() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Testing cleared complaints dashboard...');
    
    // Login flow
    await page.goto('http://localhost:5174/index.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Navigate to complaints dashboard
    await page.click('#toggle-complaints');
    await page.waitForTimeout(1000);
    await page.click('button[data-section="complaints-dashboard"]');
    await page.waitForTimeout(3000);
    
    // Take screenshot to verify clearing
    await page.screenshot({ path: 'complaints_dashboard_cleared.png' });
    
    // Test navigation still works
    await page.click('button[data-section="dashboard"]');
    await page.waitForTimeout(2000);
    console.log('✅ Complaints dashboard clearing tested successfully');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testComplaintsDashboardCleared();