import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  headless: false,
  slowMo: 200
});
const page = await browser.newPage();

// Capture all console messages
const consoleLogs = [];
page.on('console', msg => {
  const text = msg.text();
  consoleLogs.push({ type: msg.type(), text });
  if (msg.type() === 'error') {
    console.log('❌ ERROR:', text);
  } else if (text.includes('loadTrainingMatrix') || text.includes('Training') || text.includes('training')) {
    console.log('📝', msg.type().toUpperCase() + ':', text);
  }
});

page.on('pageerror', error => {
  console.log('❌ PAGE ERROR:', error.message);
});

try {
  console.log('1. Loading page...');
  await page.goto('http://127.0.0.1:58156/index.html');
  await page.waitForTimeout(2000);
  
  console.log('2. Logging in...');
  await page.fill('input[type="email"]', 'ben.howard@stoke.nhs.uk');
  await page.fill('input[type="password"]', 'Hello1!');
  await page.click('button:has-text("Sign In")');
  
  console.log('3. Waiting for dashboard...');
  await page.waitForTimeout(5000);
  
  console.log('4. Expanding Checks & Audits...');
  await page.click('#toggle-checks');
  await page.waitForTimeout(500);
  
  console.log('5. Clicking Training Tracker...');
  await page.click('button[data-section="training"]');
  
  console.log('6. Waiting and checking for function calls...');
  await page.waitForTimeout(3000);
  
  // Try to manually call loadTrainingMatrix from console
  console.log('7. Checking if loadTrainingMatrix exists...');
  const funcExists = await page.evaluate(() => {
    return {
      global: typeof loadTrainingMatrix !== 'undefined',
      window: typeof window.loadTrainingMatrix !== 'undefined',
      ctx: typeof window.ctx !== 'undefined',
      ctxSiteId: window.ctx?.site_id
    };
  });
  console.log('Function availability:', funcExists);
  
  // Try to call it manually
  if (funcExists.window) {
    console.log('8. Manually calling loadTrainingMatrix...');
    await page.evaluate(() => {
      console.log('About to call loadTrainingMatrix manually');
      if (window.loadTrainingMatrix) {
        window.loadTrainingMatrix();
      }
    });
    await page.waitForTimeout(3000);
  }
  
  // Check final state
  const tableContent = await page.locator('#training-tbody').innerText();
  console.log('\n📊 Final table content:', tableContent.substring(0, 200));
  
  await page.screenshot({ path: 'training_debug.png', fullPage: true });
  
  // Print any errors found
  const errors = consoleLogs.filter(log => log.type === 'error');
  if (errors.length > 0) {
    console.log('\n❌ All errors found:');
    errors.forEach(e => console.log('  -', e.text));
  }
  
  await page.waitForTimeout(3000);
  
} finally {
  await browser.close();
  console.log('\nTest complete');
}
