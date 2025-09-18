import { chromium } from 'playwright';

async function testAdminPageFinal() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture all console messages and errors
  page.on('console', msg => {
    console.log(`BROWSER: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
  });
  
  try {
    console.log('🔍 Testing admin page with latest fixes...');
    
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
    
    console.log('✅ Logged in successfully');
    
    // Navigate to admin page
    const adminButton = await page.locator('button:has-text("Admin Site")').first();
    await adminButton.click();
    
    console.log('⏳ Waiting for admin page to load and initialize...');
    await page.waitForTimeout(15000); // Give plenty of time for all scripts to load
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('admin.html')) {
      console.log('✅ Successfully navigated to admin.html');
      
      // Check if user details are loaded correctly
      try {
        const userName = await page.locator('#user-name').textContent();
        const siteInfo = await page.locator('#site-info').textContent();
        
        console.log('User Name Display:', userName);
        console.log('Site Info Display:', siteInfo);
        
        if (userName === 'User' || siteInfo === 'Site') {
          console.log('❌ Still showing default values - context not loaded');
        } else {
          console.log('✅ User context loaded successfully!');
        }
        
        // Check if main admin sections are visible
        const sectionsNav = await page.locator('.sections-nav').count();
        const siteOverview = await page.locator('#site-overview').count();
        
        console.log('Sections nav visible:', sectionsNav > 0 ? '✅' : '❌');
        console.log('Site overview visible:', siteOverview > 0 ? '✅' : '❌');
        
      } catch (error) {
        console.log('❌ Error checking elements:', error.message);
      }
      
    } else if (currentUrl.includes('index.html')) {
      console.log('❌ Got redirected back to index.html - admin verification still failing');
      
      // Check what's shown on the verification page
      const bodyText = await page.locator('body').textContent();
      if (bodyText.includes('Verifying admin access')) {
        console.log('❌ Still stuck on admin verification step');
      }
      
    } else {
      console.log('❌ Unexpected URL:', currentUrl);
    }
    
    await page.screenshot({ path: 'test-admin-final.png' });
    console.log('📸 Screenshot saved as test-admin-final.png');
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testAdminPageFinal().catch(console.error);