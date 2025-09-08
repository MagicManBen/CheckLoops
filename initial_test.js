import { chromium } from 'playwright';

async function testInitialState() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Testing initial state...');
    
    // Login flow
    await page.goto('http://localhost:5174/index.html');
    await page.waitForTimeout(2000);
    
    // Take screenshot of login page
    await page.screenshot({ path: 'login_page.png' });
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Take screenshot of main dashboard
    await page.screenshot({ path: 'main_dashboard.png' });
    
    // Test navigation to calendar page (first task) - need to expand Scans group first
    console.log('Testing calendar page...');
    await page.click('#toggle-scans');
    await page.waitForTimeout(1000);
    await page.click('button[data-section="calendar"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'calendar_initial.png' });
    
    // Test navigation to complaints reporting - need to expand Complaints group first
    console.log('Testing complaints reporting...');
    await page.click('#toggle-complaints');
    await page.waitForTimeout(1000);
    await page.click('button[data-section="complaints-reporting"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'complaints_reporting_initial.png' });
    
    // Test navigation to complaints dashboard
    console.log('Testing complaints dashboard...');
    await page.click('button[data-section="complaints-dashboard"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'complaints_dashboard_initial.png' });
    
    // Test navigation to training - need to expand Checks & Audits group first
    console.log('Testing training page...');
    await page.click('#toggle-checks');
    await page.waitForTimeout(1000);
    await page.click('button[data-section="training"]');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'training_initial.png' });
    
    console.log('Initial state testing complete');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testInitialState();