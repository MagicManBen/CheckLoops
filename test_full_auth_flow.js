import { chromium } from 'playwright';

async function testFullAuthFlow() {
  console.log('🚀 Starting full authentication flow test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext({
    // Clear all storage to ensure clean test
    storageState: undefined
  });
  
  const page = await context.newPage();
  
  try {
    // Clear any existing session
    console.log('\n📍 Clearing browser storage...');
    await context.clearCookies();
    
    // Test 1: Navigate to index.html with no session
    console.log('\n📍 Test 1: Loading index.html without session...');
    await page.goto('http://127.0.0.1:58156/index.html');
    await page.waitForTimeout(3000);
    
    // Check console logs for auth messages
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('Browser console:', msg.text());
      }
    });
    
    const currentUrl = page.url();
    console.log('Current URL after load:', currentUrl);
    
    // Check if we're on the login page or admin page
    if (currentUrl.includes('Home.html')) {
      console.log('✅ Successfully redirected to login page (no session)');
      
      // Perform login
      console.log('\n📍 Performing login...');
      await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
      await page.locator('input[type="password"]').fill('Hello1!');
      await page.screenshot({ path: 'before_login.png' });
      await page.click('button:has-text("Sign In")');
      
      // Wait for redirect
      await page.waitForTimeout(5000);
      console.log('URL after login:', page.url());
      
    } else {
      console.log('⚠️ Did not redirect to login - checking if already authenticated');
      
      // Check if the dashboard is visible
      const dashboardVisible = await page.locator('#view-dashboard').isVisible();
      
      if (dashboardVisible) {
        console.log('✅ Dashboard is visible - user appears to be authenticated');
        
        // Test logout
        console.log('\n📍 Testing logout...');
        const signOutBtn = await page.locator('#signout-btn');
        if (await signOutBtn.isVisible()) {
          await signOutBtn.click();
          await page.waitForTimeout(3000);
          
          const afterLogoutUrl = page.url();
          console.log('URL after logout:', afterLogoutUrl);
          
          if (afterLogoutUrl.includes('Home.html')) {
            console.log('✅ Successfully logged out and redirected to login');
            
            // Try to access index.html again
            console.log('\n📍 Testing access after logout...');
            await page.goto('http://127.0.0.1:58156/index.html');
            await page.waitForTimeout(3000);
            
            const urlAfterLogout = page.url();
            console.log('URL when accessing admin after logout:', urlAfterLogout);
            
            if (urlAfterLogout.includes('Home.html')) {
              console.log('✅ Correctly blocked access and redirected to login');
            } else {
              console.log('❌ Should have redirected to login after logout');
            }
          }
        }
      } else {
        console.log('❌ Dashboard not visible but not redirected to login - AUTH ISSUE');
        
        // Take diagnostic screenshot
        await page.screenshot({ path: 'auth_issue_state.png', fullPage: true });
        
        // Check what's visible
        const appVisible = await page.locator('#app').isVisible();
        console.log('App container visible:', appVisible);
        
        // Check for any error messages
        const bodyText = await page.locator('body').textContent();
        console.log('Page contains text:', bodyText.substring(0, 200));
      }
    }
    
    // Test navigation between sections
    console.log('\n📍 Final test: Navigation between sections...');
    
    // Ensure we're on the admin page
    if (!page.url().includes('index.html')) {
      await page.goto('http://127.0.0.1:58156/index.html');
      await page.waitForTimeout(3000);
    }
    
    const sections = ['staff', 'rooms', 'items', 'dashboard'];
    for (const section of sections) {
      const button = page.locator(`button[data-section="${section}"]`);
      if (await button.isVisible()) {
        console.log(`Testing ${section} navigation...`);
        await button.click();
        await page.waitForTimeout(1500);
        
        const viewVisible = await page.locator(`#view-${section}`).isVisible();
        console.log(`${section} view visible:`, viewVisible ? '✅' : '❌');
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: 'final_state.png', fullPage: true });
    console.log('\n📸 Screenshots saved');
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ path: 'error_state.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testFullAuthFlow().catch(console.error);