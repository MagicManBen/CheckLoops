import { chromium } from 'playwright';

async function testLiveSite() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('\n=== Testing Live Site Issues ===\n');
  
  try {
    // Test admin login and navigation
    console.log('1. Testing admin login on live site...');
    await page.goto('https://magicmanben.github.io/CheckLoops/Home.html');
    await page.waitForTimeout(3000);
    
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    console.log('  - After login, URL:', page.url());
    
    // Check if admin panel is visible
    const adminPanel = page.locator('#admin-access-panel');
    const isAdminPanelVisible = await adminPanel.isVisible();
    console.log('  - Admin access panel visible?', isAdminPanelVisible);
    
    if (isAdminPanelVisible) {
      await page.locator('a[href="admin-dashboard.html"]').click();
      await page.waitForTimeout(3000);
      console.log('  - After clicking admin link, URL:', page.url());
    }
    
    // Test staff holidays page styling
    console.log('\n2. Testing staff holidays page...');
    await page.goto('https://magicmanben.github.io/CheckLoops/Home.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(5000);
    
    // Navigate to holidays page
    await page.goto('https://magicmanben.github.io/CheckLoops/staff-holidays.html');
    await page.waitForTimeout(3000);
    
    // Take screenshot of the styling issues
    await page.screenshot({ path: 'live_site_holidays_issues.png', fullPage: true });
    console.log('  - Screenshot saved: live_site_holidays_issues.png');
    
    // Check button styles
    const requestButton = page.locator('button:has-text("Request Holiday")');
    if (await requestButton.isVisible()) {
      const buttonStyles = await requestButton.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          background: styles.background
        };
      });
      console.log('  - Request Holiday button styles:', buttonStyles);
    }
    
  } catch (error) {
    console.error('Error testing live site:', error);
  } finally {
    await browser.close();
  }
}

testLiveSite().catch(console.error);