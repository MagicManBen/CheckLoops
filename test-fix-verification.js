import { chromium } from 'playwright';

async function verifyLoginFix() {
  console.log('🔍 Verifying login fix on checkloops.co.uk...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor console messages for CSP violations
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
      console.log(`❌ CSP VIOLATION: ${msg.text()}`);
    }
  });

  try {
    console.log('1️⃣ Navigating to live site...');
    await page.goto('https://checkloops.co.uk/home.html', {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    console.log('2️⃣ Checking if Supabase client loads successfully...');
    await page.waitForTimeout(3000); // Allow time for module loading

    const supabaseAvailable = await page.evaluate(() => {
      return typeof window.supabase !== 'undefined';
    });

    if (supabaseAvailable) {
      console.log('✅ Supabase client loaded successfully!');
      console.log('✅ CSP violation fixed - login should now work');
    } else {
      console.log('❌ Supabase client still not available');

      // Check what CDN is being used
      const pageContent = await page.content();
      if (pageContent.includes('esm.sh')) {
        console.log('❌ Still using esm.sh CDN (blocked by CSP)');
      } else if (pageContent.includes('jsdelivr')) {
        console.log('✅ Using jsdelivr CDN (CSP compliant)');
        console.log('❓ Other issue preventing Supabase loading');
      }
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }

  await browser.close();
}

// Wait a moment for GitHub Pages to deploy, then verify
console.log('⏳ Waiting 30 seconds for GitHub Pages deployment...');
setTimeout(verifyLoginFix, 30000);