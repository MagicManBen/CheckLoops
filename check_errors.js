import { chromium } from 'playwright';

async function checkErrors() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  const errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push('CONSOLE ERROR: ' + msg.text());
    }
  });
  
  page.on('pageerror', error => {
    errors.push('PAGE ERROR: ' + error.message);
  });
  
  console.log('Opening http://127.0.0.1:5500/index.html...\n');
  
  try {
    await page.goto('http://127.0.0.1:5500/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    // Check if login form is visible
    const emailVisible = await page.locator('#email').isVisible().catch(() => false);
    const passwordVisible = await page.locator('#password').isVisible().catch(() => false);
    
    console.log('=== PAGE STATUS ===');
    console.log(`Email field visible: ${emailVisible}`);
    console.log(`Password field visible: ${passwordVisible}`);
    
    if (errors.length > 0) {
      console.log('\n=== JAVASCRIPT ERRORS ===');
      errors.forEach(err => console.log(err));
    }
    
    // Take screenshot
    await page.screenshot({ path: 'current_state.png' });
    console.log('\nScreenshot saved as current_state.png');
    
  } catch (e) {
    console.error('Failed to load page:', e.message);
  }
  
  await page.waitForTimeout(2000);
  await browser.close();
}

checkErrors();
