import { chromium } from 'playwright';

async function testMeetingsDirect() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Testing meetings functionality directly...');
    
    // Listen for console messages to debug loading issues
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      console.log(`Console: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.error('Page error:', error);
    });
    
    // Navigate directly to staff.html
    console.log('1. Loading staff.html directly...');
    await page.goto('file://' + process.cwd() + '/staff.html');
    await page.waitForTimeout(5000);
    
    console.log('2. Checking page structure...');
    
    // Check if meetings section exists
    const meetingsSection = await page.locator('.meetings-section').count();
    console.log(`Meetings section found: ${meetingsSection > 0}`);
    
    if (meetingsSection > 0) {
      // Check if tabs are working
      const tabs = await page.locator('.meetings-tab').count();
      console.log(`Found ${tabs} tabs`);
      
      // Check if calendar div exists
      const calendarDiv = await page.locator('#calendar').count();
      console.log(`Calendar div found: ${calendarDiv > 0}`);
      
      // Test tab switching
      console.log('3. Testing tab switching...');
      await page.click('[data-tab="agenda"]');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'direct_agenda.png' });
      
      await page.click('[data-tab="notes"]');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'direct_notes.png' });
      
      await page.click('[data-tab="history"]');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'direct_history.png' });
      
      await page.click('[data-tab="calendar"]');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'direct_calendar.png' });
      
      console.log('✅ Basic structure test completed');
    } else {
      console.log('❌ Meetings section not found');
      await page.screenshot({ path: 'no_meetings_section.png' });
    }
    
    console.log('\\nConsole messages:');
    consoleMessages.forEach(msg => console.log(`  ${msg}`));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'direct_test_error.png' });
  } finally {
    await browser.close();
  }
}

testMeetingsDirect();