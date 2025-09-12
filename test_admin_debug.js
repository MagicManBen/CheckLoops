import { chromium } from 'playwright';

async function testAdminDebug() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable all console logging
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  console.log('Logging in...');
  await page.goto('http://127.0.0.1:5500/test_supabase_direct.html');
  await page.waitForTimeout(3000);
  
  console.log('\nNavigating to admin.html...');
  await page.goto('http://127.0.0.1:5500/admin.html');
  await page.waitForTimeout(5000);
  
  // Execute JavaScript in the page to check ctx
  const ctxInfo = await page.evaluate(() => {
    if (typeof ctx !== 'undefined') {
      return {
        hasCtx: true,
        hasUser: !!ctx.user,
        userEmail: ctx.user?.email,
        fullName: ctx.full_name,
        role: ctx.role,
        siteId: ctx.site_id
      };
    }
    return { hasCtx: false };
  });
  
  console.log('\n=== CTX INFO ===');
  console.log(JSON.stringify(ctxInfo, null, 2));
  
  await browser.close();
}

testAdminDebug().catch(console.error);