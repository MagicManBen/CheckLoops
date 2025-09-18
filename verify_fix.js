import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  headless: false,
  slowMo: 200
});
const page = await browser.newPage();

// Monitor console for errors
page.on('console', msg => {
  if (msg.type() === 'error') {
    console.log('❌ ERROR:', msg.text());
  } else if (msg.text().includes('Training data loaded')) {
    console.log('✅', msg.text());
  }
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
  
  console.log('6. Waiting for matrix to load...');
  await page.waitForTimeout(4000);
  
  // Check the result
  const tableContent = await page.locator('#training-tbody').innerText();
  
  if (tableContent.includes('Loading training matrix')) {
    console.log('❌ Still showing loading message');
  } else if (tableContent.includes('No clinical staff found')) {
    console.log('⚠️ No staff data, but matrix rendered');
  } else {
    console.log('✅ Training matrix loaded successfully!');
    const rows = await page.locator('#training-tbody tr').count();
    console.log(`   Found ${rows} rows in the matrix`);
  }
  
  await page.screenshot({ path: 'training_fixed.png', fullPage: true });
  console.log('📸 Screenshot saved as training_fixed.png');
  
  // Keep open for observation
  await page.waitForTimeout(5000);
  
} finally {
  await browser.close();
  console.log('\nTest complete');
}
