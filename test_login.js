import { chromium } from 'playwright';

async function testLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing login on http://127.0.0.1:5500...');
  
  try {
    await page.goto('http://127.0.0.1:5500/index.html');
    await page.waitForTimeout(2000);
    
    // Check if login form is visible
    const emailVisible = await page.locator('#email').isVisible();
    const passwordVisible = await page.locator('#password').isVisible();
    
    console.log(`Email field visible: ${emailVisible}`);
    console.log(`Password field visible: ${passwordVisible}`);
    
    if (emailVisible && passwordVisible) {
      console.log('\nAttempting login...');
      await page.fill('#email', 'ben.howard@stoke.nhs.uk');
      await page.fill('#password', 'Hello1!');
      
      await page.screenshot({ path: 'before_login.png' });
      
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(5000);
      
      await page.screenshot({ path: 'after_login.png' });
      
      // Check if navigation is visible
      const sidebarVisible = await page.locator('#sidebar').isVisible();
      const navButtons = await page.locator('.nav button').count();
      
      console.log(`\nAfter login:`);
      console.log(`Sidebar visible: ${sidebarVisible}`);
      console.log(`Navigation buttons found: ${navButtons}`);
      
      if (navButtons > 0) {
        console.log('\n✅ LOGIN SUCCESSFUL - Navigation is working!');
        
        // Try to navigate to a section
        const trainingBtn = await page.locator('button[data-section="training"]').isVisible();
        console.log(`Training button visible: ${trainingBtn}`);
      } else {
        console.log('\n⚠️ Login may have succeeded but navigation not visible');
      }
    }
    
  } catch (error) {
    console.error('Error during testing:', error.message);
  }
  
  console.log('\nKeeping browser open for inspection...');
  await page.waitForTimeout(5000);
  await browser.close();
}

testLogin();
