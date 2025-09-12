import { chromium } from 'playwright';

async function testAllPagesAfterLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    if (!msg.text().includes('[DOM]') && !msg.text().includes('Environment')) {
      console.log('BROWSER:', msg.text());
    }
  });
  
  console.log('=== LOGGING IN VIA TEST PAGE ===');
  await page.goto('http://127.0.0.1:5500/test_supabase_direct.html');
  await page.waitForTimeout(3000);
  
  // Verify login success
  const statusText = await page.textContent('#status');
  if (!statusText.includes('Success')) {
    console.error('Login failed!');
    await browser.close();
    return;
  }
  
  console.log('Login successful! Now testing all pages...\n');
  
  const pages = [
    { name: 'Staff Home', url: 'staff.html' },
    { name: 'Staff Welcome', url: 'staff-welcome.html' },
    { name: 'Staff Meetings', url: 'staff-meetings.html' },
    { name: 'Staff Scans', url: 'staff-scans.html' },
    { name: 'Staff Training', url: 'staff-training.html' },
    { name: 'Achievements', url: 'achievements.html' },
    { name: 'Staff Quiz', url: 'staff-quiz.html' },
    { name: 'Admin (via index)', url: 'index.html' },
    { name: 'Admin Direct', url: 'admin.html' }
  ];
  
  for (let i = 0; i < pages.length; i++) {
    const pageInfo = pages[i];
    console.log(`\n=== Testing ${pageInfo.name} (${pageInfo.url}) ===`);
    
    await page.goto(`http://127.0.0.1:5500/${pageInfo.url}`);
    await page.waitForTimeout(3000);
    
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
    // Get all text content from the page
    const bodyText = await page.textContent('body');
    
    // Check for key indicators
    const hasEmail = bodyText.includes('benhowardmagic@hotmail.com');
    const hasBen = bodyText.includes('Ben') || bodyText.includes('ben');
    const hasAdmin = bodyText.includes('Admin') || bodyText.includes('admin');
    const hasSite = bodyText.includes('Harley Street');
    
    console.log('Has email displayed:', hasEmail);
    console.log('Has "Ben" displayed:', hasBen);
    console.log('Has "Admin" displayed:', hasAdmin);
    console.log('Has site name:', hasSite);
    
    // Take screenshot
    await page.screenshot({ 
      path: `test_page_${i + 1}_${pageInfo.url.replace('.html', '')}.png`, 
      fullPage: true 
    });
    
    // Special check for specific elements
    if (pageInfo.url === 'staff.html') {
      const welcomeText = await page.textContent('#welcome').catch(() => 'Not found');
      console.log('Welcome text:', welcomeText);
    }
    
    if (pageInfo.url === 'admin.html') {
      const userName = await page.textContent('#user-name').catch(() => 'Not found');
      const userRole = await page.textContent('#user-role').catch(() => 'Not found');
      const siteInfo = await page.textContent('#site-info').catch(() => 'Not found');
      console.log('Admin page - User name:', userName);
      console.log('Admin page - User role:', userRole);
      console.log('Admin page - Site info:', siteInfo);
    }
  }
  
  console.log('\n=== ALL TESTS COMPLETE ===');
  await browser.close();
}

testAllPagesAfterLogin().catch(console.error);