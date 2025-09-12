import { chromium } from 'playwright';

async function testAdminFinal() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Setting user display') || text.includes('Final display') || text.includes('Context loaded')) {
      console.log('BROWSER:', text);
    }
  });
  
  console.log('Logging in...');
  await page.goto('http://127.0.0.1:5500/test_supabase_direct.html');
  await page.waitForTimeout(3000);
  
  console.log('Navigating to admin.html...');
  await page.goto('http://127.0.0.1:5500/admin.html');
  await page.waitForTimeout(5000);
  
  // Get the user display elements
  const userName = await page.textContent('#user-name').catch(() => 'Not found');
  const userRole = await page.textContent('#user-role').catch(() => 'Not found');
  const siteInfo = await page.textContent('#site-info').catch(() => 'Not found');
  
  console.log('\n=== ADMIN PAGE DISPLAY ===');
  console.log('User Name:', userName);
  console.log('User Role:', userRole);
  console.log('Site Info:', siteInfo);
  
  // Take screenshot
  await page.screenshot({ path: 'test_admin_final.png', fullPage: true });
  
  await browser.close();
}

testAdminFinal().catch(console.error);