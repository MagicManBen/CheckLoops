import { chromium } from 'playwright';

async function testFix() {
  let browser;
  try {
    console.log('🚀 Starting test...');
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 500
    });
    
    const page = await browser.newPage();
    
    // Go directly to the main page that has the training functionality
    console.log('🌐 Going to index.html...');
    await page.goto('http://127.0.0.1:58156/index.html', { waitUntil: 'domcontentloaded' });
    
    // Wait a moment for the page to load
    await page.waitForTimeout(2000);
    
    console.log('🔍 Looking for login form...');
    
    // Clear and fill email
    await page.locator('input[type="email"]').clear();
    await page.locator('input[type="email"]').fill('ben.howard@stoke.nhs.uk');
    
    // Clear and fill password  
    await page.locator('input[type="password"]').clear();
    await page.locator('input[type="password"]').fill('Hello1!');
    
    console.log('📧 Filled credentials');
    await page.screenshot({ path: 'test_credentials.png' });
    
    console.log('🖱️ Clicking Sign In...');
    await page.click('button:has-text("Sign In")');
    
    // Wait for login to complete - look for dashboard or navigation
    console.log('⏳ Waiting for login...');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test_after_login.png' });
    
    // Now look for training navigation
    console.log('🎓 Looking for training navigation...');
    
    // Try different selectors for the training button
    const trainingSelectors = [
      'button[data-section="training"]',
      'a[href*="training"]', 
      'button:has-text("Training")',
      '[data-section="training"]'
    ];
    
    let trainingFound = false;
    for (const selector of trainingSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`✅ Found training element with selector: ${selector}`);
        await element.first().click();
        trainingFound = true;
        break;
      }
    }
    
    if (!trainingFound) {
      console.log('❌ Could not find training navigation');
      await page.screenshot({ path: 'test_no_training_nav.png' });
      return;
    }
    
    // Wait for training page to load
    console.log('⏳ Waiting for training page...');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test_training_page.png' });
    
    // Now check for the specific issue
    console.log('🔍 Checking for "Loading training matrix..." text...');
    
    const loadingElements = await page.locator('td:has-text("Loading training matrix")').count();
    const matrixRows = await page.locator('#training-tbody tr').count();
    
    console.log(`🔢 Found ${loadingElements} "Loading training matrix" messages`);
    console.log(`🔢 Found ${matrixRows} rows in training matrix`);
    
    if (loadingElements > 0) {
      console.log('❌ ISSUE STILL EXISTS: Training matrix is stuck loading!');
      await page.screenshot({ path: 'test_still_loading.png' });
    } else if (matrixRows > 0) {
      console.log('✅ SUCCESS: Training matrix loaded with data!');
      await page.screenshot({ path: 'test_success.png' });
    } else {
      console.log('⚠️ Unclear state - no loading message but no data either');
      await page.screenshot({ path: 'test_unclear.png' });
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    await page?.screenshot({ path: 'test_error.png' });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testFix();