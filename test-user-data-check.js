import { chromium } from 'playwright';

async function testUserDataCheck() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture all console messages
  page.on('console', msg => {
    console.log(msg.text());
  });
  
  try {
    console.log('🔍 Opening user data check page...');
    await page.goto('http://127.0.0.1:5500/check-user-data.html');
    
    // Wait for the check to complete
    await page.waitForTimeout(10000);
    
    // Also get the page content to see the output
    const output = await page.locator('#output').textContent();
    console.log('\n📄 PAGE OUTPUT:');
    console.log(output);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testUserDataCheck().catch(console.error);