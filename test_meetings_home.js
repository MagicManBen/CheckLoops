import { chromium } from 'playwright';

async function testMeetingsFromHome() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Testing meetings functionality from Home.html...');
    
    // Listen for console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      if (msg.text().includes('error') || msg.text().includes('Error')) {
        console.log(`Console ERROR: ${msg.text()}`);
      }
    });
    
    page.on('pageerror', error => {
      console.error('Page error:', error);
    });
    
    // Navigate to the correct home page
    console.log('1. Navigating to Home.html...');
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.waitForTimeout(3000);
    
    // Look for login elements
    console.log('2. Looking for login elements...');
    const emailField = await page.locator('#email').count();
    const passwordField = await page.locator('input[type="password"]').count();
    
    console.log(`Email field: ${emailField > 0}, Password field: ${passwordField > 0}`);
    
    if (emailField > 0 && passwordField > 0) {
      console.log('3. Logging in...');
      await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
      await page.locator('#password').fill('Hello1!');
      
      // Look for sign in button
      const signInButtons = await page.locator('button').count();
      console.log(`Found ${signInButtons} buttons`);
      
      // Try different selectors for sign in
      try {
        await page.click('button:has-text("Sign In")');
      } catch {
        try {
          await page.click('input[type="submit"]');
        } catch {
          await page.click('button[type="submit"]');
        }
      }
      
      await page.waitForTimeout(5000);
      
      console.log('4. Checking current URL after login...');
      console.log(`Current URL: ${page.url()}`);
      
      // Navigate to staff page
      console.log('5. Navigating to staff page...');
      await page.goto('http://127.0.0.1:58156/staff.html');
      await page.waitForTimeout(5000);
      
      console.log('6. Checking for meetings section...');
      const meetingsSection = await page.locator('.meetings-section').count();
      console.log(`Meetings section found: ${meetingsSection > 0}`);
      
      if (meetingsSection > 0) {
        console.log('7. Testing meetings functionality...');
        
        // Take screenshot of calendar
        await page.screenshot({ path: 'authenticated_calendar.png' });
        
        // Test agenda tab
        await page.click('[data-tab="agenda"]');
        await page.waitForTimeout(2000);
        const agendaItems = await page.locator('.agenda-item').count();
        console.log(`Agenda items: ${agendaItems}`);
        await page.screenshot({ path: 'authenticated_agenda.png' });
        
        // Test notes tab
        await page.click('[data-tab="notes"]');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'authenticated_notes.png' });
        
        // Test history tab
        await page.click('[data-tab="history"]');
        await page.waitForTimeout(2000);
        const historyItems = await page.locator('.meeting-history-item').count();
        console.log(`History items: ${historyItems}`);
        await page.screenshot({ path: 'authenticated_history.png' });
        
        console.log('✅ Meetings functionality working!');
        
      } else {
        console.log('❌ Meetings section still not found');
        await page.screenshot({ path: 'authenticated_no_meetings.png' });
        
        // Check if we're on the right page
        const pageTitle = await page.title();
        console.log(`Page title: ${pageTitle}`);
      }
      
    } else {
      console.log('❌ Login form not found on Home.html');
      await page.screenshot({ path: 'home_no_login.png' });
    }
    
    console.log('\\nRelevant console messages:');
    consoleMessages.filter(msg => 
      msg.includes('Initializing meetings') || 
      msg.includes('Loading meetings') || 
      msg.includes('error') || 
      msg.includes('Error') ||
      msg.includes('Calendar')
    ).forEach(msg => console.log(`  ${msg}`));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'home_test_error.png' });
  } finally {
    await browser.close();
  }
}

testMeetingsFromHome();