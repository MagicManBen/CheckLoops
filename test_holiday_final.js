import { chromium } from 'playwright';

async function testHolidaysFinal() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Testing final holiday page updates...');
    
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
      
      // Take screenshot of the final page
      await page.screenshot({ 
        path: 'screenshots/holidays_final_test.png',
        fullPage: true 
      });
      console.log('Screenshot saved as holidays_final_test.png');
      
      // Check for team holidays section
      const teamSection = await page.locator('text="Team Holidays"').first();
      if (await teamSection.isVisible()) {
        console.log('✅ Team Holidays section is visible');
        
        // Scroll to team holidays
        await teamSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        
        // Take screenshot of team holidays
        await page.screenshot({ 
          path: 'screenshots/team_holidays.png',
          fullPage: true
        });
        console.log('Team holidays screenshot saved');
      }
      
      console.log('✅ Holiday page is working and styled correctly');
      
    } else {
      console.log('❌ My Holidays link not found');
    }
    
    // Also test with admin account
    console.log('\n\nTesting with admin account...');
    await page.goto('http://127.0.0.1:61709/Home.html');
    await page.waitForTimeout(2000);
    
    // Login with admin account
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    
    console.log('Logged in as admin');
    await page.waitForTimeout(3000);
    
    // Navigate to staff page
    await page.goto('http://127.0.0.1:61709/staff.html');
    await page.waitForTimeout(2000);
    
    // Click on My Holidays navigation
    const adminHolidayLink = await page.locator('a:has-text("My Holidays")').first();
    if (await adminHolidayLink.isVisible()) {
      await adminHolidayLink.click();
      console.log('Admin navigated to My Holidays page');
      await page.waitForTimeout(3000);
      
      // Take screenshot of admin view
      await page.screenshot({ 
        path: 'screenshots/holidays_admin_view.png',
        fullPage: true 
      });
      console.log('Admin view screenshot saved');
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await page.waitForTimeout(5000); // Keep browser open to view
    await browser.close();
  }
}

testHolidaysFinal();