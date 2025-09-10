import { chromium } from 'playwright';

async function testMeetingsWithServer() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Testing meetings functionality with server...');
    
    // Listen for console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      console.log(`Console: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.error('Page error:', error);
    });
    
    // Navigate to the home page to login
    console.log('1. Navigating to home page...');
    await page.goto('http://127.0.0.1:58156/Homepage.html');
    await page.waitForTimeout(2000);
    
    // Look for login elements
    const emailField = await page.locator('#email').count();
    const passwordField = await page.locator('input[type="password"]').count();
    const signInBtn = await page.locator('button:has-text("Sign In")').count();
    
    console.log(`Email field: ${emailField > 0}, Password field: ${passwordField > 0}, Sign in button: ${signInBtn > 0}`);
    
    if (emailField > 0 && passwordField > 0 && signInBtn > 0) {
      console.log('2. Logging in...');
      await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
      await page.locator('input[type="password"]').fill('Hello1!');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
    } else {
      console.log('2. Login form not found, trying to navigate to staff page directly...');
    }
    
    // Navigate to staff page
    console.log('3. Navigating to staff page...');
    await page.goto('http://127.0.0.1:58156/staff.html');
    await page.waitForTimeout(5000);
    
    console.log('4. Checking for meetings section...');
    const meetingsSection = await page.locator('.meetings-section').count();
    console.log(`Meetings section found: ${meetingsSection > 0}`);
    
    if (meetingsSection > 0) {
      console.log('5. Taking screenshots of each tab...');
      
      // Calendar tab (default)
      await page.screenshot({ path: 'server_calendar.png' });
      
      // Agenda tab
      await page.click('[data-tab="agenda"]');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'server_agenda.png' });
      
      // Notes tab
      await page.click('[data-tab="notes"]');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'server_notes.png' });
      
      // History tab
      await page.click('[data-tab="history"]');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'server_history.png' });
      
      // Back to calendar
      await page.click('[data-tab="calendar"]');
      await page.waitForTimeout(3000);
      
      console.log('6. Checking if data is loading...');
      
      // Check agenda tab
      await page.click('[data-tab="agenda"]');
      await page.waitForTimeout(1000);
      const agendaItems = await page.locator('.agenda-item').count();
      console.log(`Agenda items found: ${agendaItems}`);
      
      // Check history tab
      await page.click('[data-tab="history"]');
      await page.waitForTimeout(1000);
      const historyItems = await page.locator('.meeting-history-item').count();
      console.log(`History items found: ${historyItems}`);
      
      console.log('✅ Meetings functionality test completed');
      
    } else {
      console.log('❌ Meetings section not found');
      await page.screenshot({ path: 'server_no_meetings.png' });
    }
    
    console.log('\\nAll console messages:');
    consoleMessages.forEach(msg => console.log(`  ${msg}`));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'server_test_error.png' });
  } finally {
    await browser.close();
  }
}

testMeetingsWithServer();