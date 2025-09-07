import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  headless: false,
  slowMo: 300
});
const page = await browser.newPage();

console.log('1. Loading page...');
await page.goto('http://127.0.0.1:58156/index.html');
await page.waitForTimeout(2000);

console.log('2. Logging in...');
await page.fill('input[type="email"]', 'ben.howard@stoke.nhs.uk');
await page.fill('input[type="password"]', 'Hello1!');
await page.click('button:has-text("Sign In")');

console.log('3. Waiting for dashboard...');
await page.waitForTimeout(6000);

console.log('4. Expanding Checks & Audits menu...');
// Click the Checks & Audits toggle
await page.click('#toggle-checks');
await page.waitForTimeout(1000);

console.log('5. Clicking Training Tracker...');
await page.click('button[data-section="training"]');

console.log('6. Waiting for training matrix to load...');
await page.waitForTimeout(5000);

// Check table content
const tbody = page.locator('#training-tbody');
const tableText = await tbody.innerText().catch(() => 'No table found');
console.log('Training matrix content:', tableText);

// Check if still loading
if (tableText.includes('Loading training matrix')) {
  console.log('❌ Training matrix is still loading');
} else if (tableText.includes('No clinical staff found') || tableText.includes('Failed to load')) {
  console.log('⚠️ Training matrix loaded but has an issue:', tableText);
} else {
  console.log('✅ Training matrix loaded successfully');
}

await page.screenshot({ path: 'training_matrix_expanded.png', fullPage: true });
console.log('Screenshot saved as training_matrix_expanded.png');

await page.waitForTimeout(5000);
await browser.close();
console.log('Test complete');
