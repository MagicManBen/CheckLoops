import { chromium } from 'playwright';

async function debugAdminFlow() {
  console.log('🔧 Debugging Admin Flow...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to login
    console.log('🔐 Going to login page...');
    await page.goto('http://127.0.0.1:58156/index.html');
    await page.waitForTimeout(3000);
    
    // Take screenshot of login page
    await page.screenshot({ path: 'debug_1_login_form.png', fullPage: true });
    console.log('📸 Screenshot: debug_1_login_form.png');
    
    // Find login elements
    const emailInput = await page.locator('input[type="email"], #email, input[name="email"]').first();
    const passwordInput = await page.locator('input[type="password"]').first();
    const loginButton = await page.locator('button:has-text("Sign In"), button:has-text("Login"), input[type="submit"]').first();
    
    if (await emailInput.count() > 0) {
      console.log('✅ Found email input');
      await emailInput.fill('ben.howard@stoke.nhs.uk');
      
      if (await passwordInput.count() > 0) {
        console.log('✅ Found password input');
        await passwordInput.fill('Hello1!');
        
        if (await loginButton.count() > 0) {
          console.log('✅ Found login button');
          await loginButton.click();
          await page.waitForTimeout(3000);
          
          console.log('📍 Current URL after login:', page.url());
          await page.screenshot({ path: 'debug_2_after_login.png', fullPage: true });
          console.log('📸 Screenshot: debug_2_after_login.png');
          
          // Look for admin button on current page
          const adminButton = await page.locator('button:has-text("Admin"), a:has-text("Admin"), button:has-text("Admin Site"), a:has-text("Admin Site")').first();
          
          if (await adminButton.count() > 0) {
            console.log('✅ Found admin button');
            const buttonText = await adminButton.textContent();
            const buttonHref = await adminButton.getAttribute('href');
            console.log('🔗 Admin button text:', buttonText);
            console.log('🔗 Admin button href:', buttonHref);
            
            await adminButton.click();
            await page.waitForTimeout(3000);
            
            console.log('📍 URL after clicking admin button:', page.url());
            await page.screenshot({ path: 'debug_3_admin_clicked.png', fullPage: true });
            console.log('📸 Screenshot: debug_3_admin_clicked.png');
            
          } else {
            console.log('❌ Admin button not found');
            await page.screenshot({ path: 'debug_3_no_admin_button.png', fullPage: true });
            
            // Let's see what buttons are available
            const allButtons = await page.locator('button, a').all();
            console.log('🔍 Available buttons/links:');
            for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
              const text = await allButtons[i].textContent();
              const href = await allButtons[i].getAttribute('href');
              console.log(`  - "${text}" href="${href}"`);
            }
          }
        } else {
          console.log('❌ Login button not found');
        }
      } else {
        console.log('❌ Password input not found');
      }
    } else {
      console.log('❌ Email input not found');
      console.log('📍 Current page HTML preview:');
      const bodyText = await page.locator('body').textContent();
      console.log(bodyText.substring(0, 500) + '...');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    await page.screenshot({ path: 'debug_error.png', fullPage: true });
  } finally {
    console.log('⏳ Keeping browser open for 15 seconds to review...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

debugAdminFlow().catch(console.error);