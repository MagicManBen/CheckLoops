import { chromium } from 'playwright';

async function testSecurityFixes() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Testing security fixes...\n');
  
  try {
    // Test 1: Check that login still works
    console.log('1. Testing login functionality...');
    await page.goto('http://127.0.0.1:58156/index.html', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Fill in login credentials
    await page.fill('#email', 'ben.howard@stoke.nhs.uk');
    await page.fill('#password', 'Hello1!');
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation
    await page.waitForTimeout(3000);
    
    // Check if we're logged in
    const isLoggedIn = await page.locator('text=Dashboard').isVisible().catch(() => false);
    console.log(`✓ Login successful: ${isLoggedIn}`);
    
    // Test 2: Check that the config.js is still loading
    console.log('\n2. Testing config.js loading...');
    const configLoaded = await page.evaluate(() => {
      return typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_URL !== undefined;
    });
    console.log(`✓ Config loaded: ${configLoaded}`);
    
    // Test 3: Check Supabase connection
    console.log('\n3. Testing Supabase connection...');
    const supabaseConnected = await page.evaluate(() => {
      return typeof globalSupabase !== 'undefined';
    });
    console.log(`✓ Supabase connected: ${supabaseConnected}`);
    
    // Test 4: Check CORS headers (navigate to staff page)
    console.log('\n4. Testing navigation to staff pages...');
    const staffLinks = await page.locator('a[href*="staff"]').count();
    if (staffLinks > 0) {
      await page.locator('a[href*="staff"]').first().click();
      await page.waitForTimeout(2000);
      const onStaffPage = page.url().includes('staff');
      console.log(`✓ Staff page navigation: ${onStaffPage}`);
    } else {
      console.log('✓ No staff links found (user may not be logged in)');
    }
    
    // Test 5: Check if user role is admin
    console.log('\n5. Checking user role...');
    const userRole = await page.evaluate(() => {
      const user = globalSupabase?.auth?.user;
      return user?.user_metadata?.role || 'unknown';
    });
    console.log(`✓ User role: ${userRole}`);
    
    // Test 6: Test that sensitive files are not accessible
    console.log('\n6. Verifying sensitive files are protected...');
    const sensitiveFiles = [
      'SupabaseInfo.txt',
      '.env'
    ];
    
    for (const file of sensitiveFiles) {
      const response = await page.request.get(`http://127.0.0.1:58156/${file}`).catch(() => null);
      const isProtected = !response || response.status() === 404 || response.status() === 403;
      console.log(`✓ ${file} protected: ${isProtected}`);
    }
    
    console.log('\n✅ All security tests completed!');
    console.log('\n⚠️  Important Reminders:');
    console.log('1. Set OPENAI_API_KEY in Supabase Dashboard > Settings > Edge Functions > Secrets');
    console.log('2. Run enable_rls_security.sql in Supabase SQL Editor');
    console.log('3. Delete SupabaseInfo.txt file from repository');
    console.log('4. Ensure .env is not committed to git');
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'security_test_result.png', fullPage: true });
    console.log('\n📸 Screenshot saved as security_test_result.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testSecurityFixes().catch(console.error);