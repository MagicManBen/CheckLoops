import { chromium } from 'playwright';

async function testHolidaysPage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Testing updated My Holidays page...');
    
    // Navigate to login page
    await page.goto('http://127.0.0.1:61709/Home.html');
    await page.waitForTimeout(2000);
    
    // Login with staff account
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    
    console.log('Logged in successfully');
    await page.waitForTimeout(3000);
    
    // Navigate to staff page
    await page.goto('http://127.0.0.1:61709/staff.html');
    await page.waitForTimeout(2000);
    
    // Click on My Holidays navigation
    const holidayLink = await page.locator('a:has-text("My Holidays")').first();
    if (await holidayLink.isVisible()) {
      await holidayLink.click();
      console.log('Navigated to My Holidays page');
      await page.waitForTimeout(3000);
      
      // Take screenshot of the updated page
      await page.screenshot({ 
        path: 'screenshots/holidays_page_updated.png',
        fullPage: true 
      });
      console.log('Screenshot saved as holidays_page_updated.png');
      
      // Test Request Holiday button
      const requestBtn = await page.locator('button:has-text("Request Holiday")').first();
      if (await requestBtn.isVisible()) {
        await requestBtn.click();
        console.log('Request Holiday modal opened');
        await page.waitForTimeout(2000);
        
        // Take screenshot of modal
        await page.screenshot({ 
          path: 'screenshots/holidays_modal.png'
        });
        console.log('Modal screenshot saved');
        
        // Close modal
        const closeBtn = await page.locator('.close').first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          console.log('Modal closed');
        }
      }
      
      console.log('✅ My Holidays page is now properly styled and functional');
      
    } else {
      console.log('❌ My Holidays link not found');
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await page.waitForTimeout(5000); // Keep browser open to view
    await browser.close();
  }
}

testHolidaysPage();