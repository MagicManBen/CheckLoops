import { chromium } from 'playwright';

async function debugAdminPage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture all console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('loadContext') || 
        text.includes('Profile') || 
        text.includes('Context') ||
        text.includes('Failed') ||
        text.includes('❌') ||
        text.includes('💥') ||
        text.includes('Bootstrap') ||
        text.includes('Error')) {
      console.log(`BROWSER: ${text}`);
    }
  });
  
  try {
    console.log('🔍 Testing admin page context loading...');
    
    // Login first
    await page.goto('http://127.0.0.1:5500/home.html');
    await page.waitForTimeout(2000);
    
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('#password', 'Hello1!');
    await page.click('button[type="submit"]:has-text("Sign In")');
    
    await page.waitForTimeout(5000);
    
    if (!page.url().includes('staff.html')) {
      console.log('❌ Login failed');
      return;
    }
    
    console.log('✅ Logged in, navigating to admin page...');
    
    // Navigate to admin page
    const adminButton = await page.locator('button:has-text("Admin Site")').first();
    await adminButton.click();
    
    // Wait and watch for console messages
    console.log('⏳ Waiting for admin page to load and watching console...');
    await page.waitForTimeout(15000); // Give plenty of time
    
    const currentUrl = page.url();
    console.log('Final URL:', currentUrl);
    
    if (currentUrl.includes('admin.html')) {
      // Check if the user details loaded
      const userName = await page.locator('#user-name').textContent();
      const siteInfo = await page.locator('#site-info').textContent();
      
      console.log('User Name:', userName);
      console.log('Site Info:', siteInfo);
      
      if (userName === 'User' && siteInfo === 'Site') {
        console.log('❌ Context loading failed - still showing defaults');
      } else {
        console.log('✅ Context loaded successfully');
      }
    }
    
    await page.screenshot({ path: 'test-admin-debug.png' });
    
  } catch (error) {
    console.error('Debug error:', error.message);
  } finally {
    await browser.close();
  }
}

debugAdminPage().catch(console.error);