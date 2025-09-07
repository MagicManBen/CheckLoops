import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  headless: false,
  slowMo: 500
});
const page = await browser.newPage();

console.log('Loading page...');
await page.goto('http://127.0.0.1:58156/index.html');
await page.waitForTimeout(2000);

console.log('Logging in...');
await page.fill('input[type="email"]', 'ben.howard@stoke.nhs.uk');
await page.fill('input[type="password"]', 'Hello1!');
await page.click('button:has-text("Sign In")');

console.log('Waiting for redirect...');
await page.waitForTimeout(8000);

// Check if we're on the dashboard
const url = page.url();
console.log('Current URL:', url);

// Try to find and click Training
try {
  console.log('Looking for Training button...');
  // Try multiple selectors
  const selectors = [
    'button:has-text("Training")',
    '[data-section="training"]',
    'nav button:has-text("Training")'
  ];
  
  let clicked = false;
  for (const selector of selectors) {
    try {
      const elem = page.locator(selector).first();
      if (await elem.isVisible({ timeout: 1000 })) {
        console.log(`Found with selector: ${selector}`);
        await elem.click();
        clicked = true;
        break;
      }
    } catch (e) {
      // Try next selector
    }
  }
  
  if (!clicked) {
    console.log('Could not find Training button');
    await page.screenshot({ path: 'no_training_button.png' });
  } else {
    console.log('Training button clicked, waiting...');
    await page.waitForTimeout(5000);
    
    // Check table content
    const tableText = await page.locator('#training-tbody').innerText().catch(() => 'Table not found');
    console.log('Table content:', tableText);
    
    await page.screenshot({ path: 'training_matrix_view.png', fullPage: true });
  }
} catch (error) {
  console.error('Error:', error.message);
  await page.screenshot({ path: 'test_error.png' });
}

await page.waitForTimeout(5000);
await browser.close();
console.log('Done');
