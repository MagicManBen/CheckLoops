# Browser Testing Setup

## Prerequisites
- Node.js and npm installed
- Playwright installed: `npm install playwright`
- Chromium browser: `npx playwright install chromium`

## Test Credentials
- Email: `ben.howard@stoke.nhs.uk`
- Password: `Hello1!`
- Test URL: `http://127.0.0.1:58156/index.html`

## Available Test Scripts

### Quick Manual Test
```bash
open -a "Google Chrome" "http://127.0.0.1:58156/index.html"
```

### Automated Testing
```bash
node test_training_matrix.js    # Full automated test
node simple_test.js            # Basic test with screenshots
node final_test.js             # Comprehensive test
```

## Browser Automation Template

Use this template for future browser testing:

```javascript
import { chromium } from 'playwright';

async function testFeature() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate and login
    await page.goto('http://127.0.0.1:58156/index.html');
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('input[type="password"]').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Your test logic here
    await page.screenshot({ path: 'test_result.png' });
    
  } finally {
    await browser.close();
  }
}

testFeature();
```

## Common Selectors
- Login email: `#email`
- Login password: `input[type="password"]`
- Login button: `button:has-text("Sign In")`
- Training section: `button[data-section="training"]`
- Training table: `#training-tbody`