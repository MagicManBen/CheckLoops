import { chromium } from 'playwright';

async function verifyIssue() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Navigating to CheckLoop...');
  await page.goto('http://127.0.0.1:58156/index.html');
  
  console.log('Logging in...');
  await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
  await page.locator('input[type="password"]').fill('Hello1!');
  await page.click('button:has-text("Sign In")');
  
  console.log('Waiting for login to complete...');
  await page.waitForTimeout(3000);
  
  console.log('Navigating to Training section...');
  await page.click('button[data-section="training"]');
  await page.waitForTimeout(2000);
  
  console.log('Taking screenshot of current issue...');
  await page.screenshot({ path: 'training_matrix_issue.png', fullPage: true });
  
  // Check for the loading message
  const loadingMessage = await page.locator('td:has-text("Loading training matrix...")').isVisible();
  console.log('Loading message visible:', loadingMessage);
  
  // Keep browser open for 5 seconds to observe
  await page.waitForTimeout(5000);
  
  await browser.close();
  console.log('Browser closed.');
}

verifyIssue().catch(console.error);