import { chromium } from 'playwright';

async function testMeetingsAuthenticated() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Testing meetings feature with authentication...');
    
    // Navigate to homepage first to login
    console.log('1. Logging in...');
    await page.goto('http://127.0.0.1:58156/index.html');
    await page.waitForTimeout(3000);
    
    // Fill login form
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('input[type="password"]').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Navigate to staff page
    console.log('2. Navigating to staff page...');
    await page.goto('http://127.0.0.1:58156/staff.html');
    await page.waitForTimeout(5000);
    
    console.log('3. Checking if meetings section exists...');
    const meetingsSection = await page.locator('.meetings-section').count();
    console.log(`Meetings section found: ${meetingsSection > 0}`);
    
    if (meetingsSection > 0) {
      // Test calendar tab
      console.log('4. Testing calendar view...');
      await page.screenshot({ path: 'meetings_calendar_auth.png' });
      
      // Check if calendar is loading
      const calendarDiv = await page.locator('#calendar').count();
      console.log(`Calendar div found: ${calendarDiv > 0}`);
      
      // Wait for calendar to initialize
      await page.waitForTimeout(3000);
      
      // Test other tabs
      console.log('5. Testing agenda tab...');
      await page.click('[data-tab="agenda"]');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'meetings_agenda_auth.png' });
      
      console.log('6. Testing notes tab...');
      await page.click('[data-tab="notes"]');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'meetings_notes_auth.png' });
      
      console.log('7. Testing history tab...');
      await page.click('[data-tab="history"]');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'meetings_history_auth.png' });
      
      // Check console for errors
      const consoleMessages = [];
      page.on('console', msg => consoleMessages.push(msg.text()));
      
      console.log('✅ Test completed successfully!');
      
      if (consoleMessages.length > 0) {
        console.log('Console messages:');
        consoleMessages.forEach(msg => console.log(`  ${msg}`));
      }
    } else {
      console.log('❌ Meetings section not found on staff page');
      await page.screenshot({ path: 'staff_page_no_meetings.png' });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test_error.png' });
  } finally {
    await browser.close();
  }
}

testMeetingsAuthenticated();