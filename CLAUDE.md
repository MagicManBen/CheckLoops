# Claude Instructions for CheckLoop Project

## Browser Testing Protocol

**ALWAYS use browser automation for testing, never just open browsers manually.**

### Required Steps for Any UI Testing:
1. Install Playwright if not available: `npm install playwright && npx playwright install chromium`
2. Create test script using template from TESTING.md
3. Run automated test to verify changes
4. Take screenshots for verification
5. Report results with evidence

### Test Credentials:
- URL: `http://127.0.0.1:58156/index.html`
- Email: `ben.howard@stoke.nhs.uk` 
- Password: `Hello1!`

### Common Test Pattern:
```javascript
import { chromium } from 'playwright';

async function testFix() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Login flow
  await page.goto('http://127.0.0.1:58156/index.html');
  await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
  await page.locator('input[type="password"]').fill('Hello1!');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(3000);
  
  // Navigate to section being tested
  await page.click('button[data-section="SECTION_NAME"]');
  
  // Verify fix with screenshots
  await page.screenshot({ path: 'test_result.png' });
  
  await browser.close();
}
```

### When Testing Changes:
- NEVER mark testing as complete without actually running automated tests
- ALWAYS take before/after screenshots
- ALWAYS verify the specific issue is resolved
- ALWAYS log in properly to test authenticated features

## Project Structure
- `index.html` - Main application file
- `SupabaseInfo.txt` - Database schema information
- `TESTING.md` - Detailed testing instructions
- Test scripts: `*_test.js` files

## Development Commands
- Run linting: `npm run lint` (if available)
- Run tests: `npm test` (if available)
- Start server: Check README or package.json for specific commands