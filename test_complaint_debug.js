import { chromium } from 'playwright';

async function testComplaintEdit() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const page = await browser.newPage();
  
  // Log all console messages
  page.on('console', msg => {
    console.log('Browser:', msg.text());
  });
  
  console.log('Testing Complaint Edit...\n');
  
  // Login
  await page.goto('http://127.0.0.1:5500/index.html');
  await page.waitForTimeout(2000);
  await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
  await page.locator('#password').fill('Hello1!');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(4000);
  
  // Navigate to complaints
  await page.click('#toggle-complaints');
  await page.waitForTimeout(500);
  await page.click('button[data-section="complaints-reporting"]');
  await page.waitForTimeout(2500);
  
  // Click first complaint
  const firstRow = await page.locator('#complaints-tbody tr').first();
  await firstRow.click();
  await page.waitForTimeout(2000);
  
  // Click Edit
  await page.click('button:has-text("Edit"):visible');
  await page.waitForTimeout(3000);
  
  // Check modal visibility
  const modalVisible = await page.evaluate(() => {
    const modal = document.getElementById('crud-modal');
    if (!modal) return { found: false };
    
    const hasShowClass = modal.classList.contains('show');
    const computedDisplay = window.getComputedStyle(modal).display;
    const isVisible = modal.offsetParent !== null;
    
    return {
      found: true,
      hasShowClass,
      computedDisplay,
      isVisible,
      classList: Array.from(modal.classList),
      style: modal.getAttribute('style')
    };
  });
  
  console.log('\nModal state:', modalVisible);
  
  await page.screenshot({ path: 'complaint_edit_debug.png', fullPage: true });
  
  await page.waitForTimeout(5000);
  await browser.close();
}

testComplaintEdit().catch(console.error);