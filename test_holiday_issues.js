import { chromium } from 'playwright';

async function testHolidayIssues() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('\n=== Testing Holiday System Issues ===\n');
  
  try {
    // 1. Test admin navigation issue
    console.log('1. Testing admin navigation redirect issue...');
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.waitForTimeout(2000);
    
    // Fill login form
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Should be on staff.html now
    console.log('  - Logged in as admin, current URL:', page.url());
    
    // Try to click admin link
    const adminLink = page.locator('a[href="admin-dashboard.html"]');
    const isVisible = await adminLink.isVisible();
    console.log('  - Admin link visible?', isVisible);
    
    if (isVisible) {
      await adminLink.click();
      await page.waitForTimeout(2000);
      console.log('  - After clicking admin link, URL:', page.url());
      
      if (page.url().includes('admin-dashboard.html')) {
        console.log('  ✅ Admin navigation works!');
      } else {
        console.log('  ❌ Admin navigation failed - redirected to:', page.url());
      }
    } else {
      console.log('  ❌ Admin link not visible');
    }
    
    // 2. Test staff holiday page styling
    console.log('\n2. Testing staff holiday page styling...');
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Navigate to holidays page
    await page.goto('http://127.0.0.1:58156/staff-holidays.html');
    await page.waitForTimeout(2000);
    
    // Take screenshot to see styling issues
    await page.screenshot({ path: 'holiday_styling_issues.png', fullPage: true });
    console.log('  - Screenshot saved as holiday_styling_issues.png');
    
    // Check for button visibility
    const requestButton = page.locator('button:has-text("Request Holiday")');
    if (await requestButton.isVisible()) {
      const buttonStyles = await requestButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          background: styles.background,
          color: styles.color,
          border: styles.border
        };
      });
      console.log('  - Request Holiday button styles:', buttonStyles);
    }
    
    // Check if any buttons are white on white
    const allButtons = await page.locator('button').all();
    console.log(`  - Found ${allButtons.length} buttons on page`);
    
    for (let i = 0; i < Math.min(3, allButtons.length); i++) {
      const btn = allButtons[i];
      const text = await btn.textContent();
      const styles = await btn.evaluate(el => {
        const s = window.getComputedStyle(el);
        return {
          bg: s.backgroundColor,
          color: s.color
        };
      });
      console.log(`    Button "${text}": bg=${styles.bg}, color=${styles.color}`);
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
    console.log('\n=== Test Complete ===\n');
  }
}

testHolidayIssues().catch(console.error);