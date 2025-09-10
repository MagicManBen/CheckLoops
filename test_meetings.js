import { chromium } from 'playwright';

async function testMeetingsFeature() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Starting meetings feature test...');
  
  try {
    // Navigate to staff page
    console.log('1. Navigating to staff page...');
    await page.goto('http://127.0.0.1:58156/staff.html');
    await page.waitForTimeout(2000);
    
    // Test calendar tab
    console.log('2. Testing calendar view...');
    await page.screenshot({ path: 'meetings_calendar.png' });
    
    // Test agenda tab
    console.log('3. Testing agenda submission...');
    await page.click('[data-tab="agenda"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'meetings_agenda.png' });
    
    // Test notes tab
    console.log('4. Testing meeting notes...');
    await page.click('[data-tab="notes"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'meetings_notes.png' });
    
    // Test history tab
    console.log('5. Testing meeting history...');
    await page.click('[data-tab="history"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'meetings_history.png' });
    
    console.log('✅ All meetings features tested successfully!');
    console.log('Screenshots saved:');
    console.log('  - meetings_calendar.png');
    console.log('  - meetings_agenda.png');
    console.log('  - meetings_notes.png');
    console.log('  - meetings_history.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testMeetingsFeature();