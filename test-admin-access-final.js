import { chromium } from 'playwright';

async function testAdminAccess() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Log important console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Context loaded') || text.includes('Profile') || text.includes('Site') || text.includes('User')) {
      console.log(`BROWSER:`, text);
    }
  });
  
  try {
    console.log('🚀 TESTING ADMIN ACCESS AND DATA LOADING');
    console.log('=========================================');
    
    // Login first
    console.log('\n📍 Logging in...');
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
    
    // Wait for staff page to fully load
    await page.waitForTimeout(3000);
    
    // Check details on staff page first
    console.log('\n📍 Staff page details:');
    const staffEmail = await page.locator('#email-pill').textContent();
    const staffRole = await page.locator('#role-pill').textContent();
    const staffSite = await page.locator('#site-pill').textContent();
    console.log('  Email:', staffEmail);
    console.log('  Role:', staffRole);
    console.log('  Site:', staffSite);
    
    // Now click Admin Site button
    console.log('\n📍 Clicking Admin Site button...');
    const adminButton = await page.locator('button:has-text("Admin Site")').first();
    
    if (await adminButton.isVisible()) {
      await adminButton.click();
      console.log('  Clicked Admin Site button');
      
      // Wait for navigation and data loading
      console.log('  Waiting for admin page to load...');
      await page.waitForTimeout(8000); // Give plenty of time
      
      const currentUrl = page.url();
      console.log('  Current URL:', currentUrl);
      
      if (currentUrl.includes('admin.html')) {
        console.log('✅ On admin.html');
        
        // Wait a bit more for data to fully load
        await page.waitForTimeout(3000);
        
        // Check user details
        const adminUserName = await page.locator('#user-name').textContent();
        const adminSiteInfo = await page.locator('#site-info').textContent();
        const adminUserInitials = await page.locator('#user-initials').textContent();
        
        console.log('\n📊 ADMIN PAGE DATA:');
        console.log('  User Name:', adminUserName);
        console.log('  Site Info:', adminSiteInfo);
        console.log('  User Initials:', adminUserInitials);
        
        // Check if data actually loaded
        if (adminUserName === 'User' || adminSiteInfo === 'Site') {
          console.log('\n❌ PROBLEM: Admin page showing default placeholders!');
          console.log('   User details not loading properly');
        } else {
          console.log('\n✅ SUCCESS: Admin page data loaded correctly!');
        }
        
        await page.screenshot({ path: 'test-admin-final.png' });
        
      } else if (currentUrl.includes('index.html')) {
        console.log('❌ Stuck on index.html');
        await page.screenshot({ path: 'test-admin-stuck.png' });
      }
    } else {
      console.log('❌ Admin Site button not visible');
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    console.log('\n📸 Screenshot saved as test-admin-final.png');
    await browser.close();
  }
}

testAdminAccess().catch(console.error);