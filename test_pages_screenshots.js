import { chromium } from 'playwright';

async function testPagesScreenshots() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('=== BYPASSING HOME.HTML - LOGGING IN DIRECTLY ===\n');
  
  // Login via test page that works
  await page.goto('http://127.0.0.1:5500/test_supabase_direct.html');
  await page.waitForTimeout(3000);
  
  const statusText = await page.textContent('#status');
  if (!statusText.includes('Success')) {
    console.error('Direct login failed!');
    await browser.close();
    return;
  }
  
  console.log('✅ Logged in successfully\n');
  console.log('Taking screenshots of all pages...\n');
  
  const pages = [
    'staff.html',
    'staff-welcome.html', 
    'staff-meetings.html',
    'staff-scans.html',
    'staff-training.html',
    'achievements.html',
    'staff-quiz.html',
    'admin.html'
  ];
  
  for (const pageUrl of pages) {
    console.log(`Screenshotting ${pageUrl}...`);
    await page.goto(`http://127.0.0.1:5500/${pageUrl}`);
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: `screenshot_${pageUrl.replace('.html', '')}.png`, 
      fullPage: true 
    });
  }
  
  console.log('\n=== SCREENSHOTS COMPLETE ===');
  console.log('Check screenshot_*.png files');
  
  await browser.close();
}

testPagesScreenshots().catch(console.error);