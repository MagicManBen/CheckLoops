import { chromium } from 'playwright';

async function quickTest() {
  let browser;
  try {
    console.log('🚀 Starting test...');
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 1000 // Slow down for visibility
    });
    
    const page = await browser.newPage();
    
    console.log('🌐 Going to site...');
    await page.goto('http://127.0.0.1:58156/index.html', { waitUntil: 'networkidle' });
    
    // Take initial screenshot
    await page.screenshot({ path: 'step1_loaded.png' });
    console.log('📸 Initial page screenshot saved');
    
    // Look for login form
    console.log('🔍 Looking for login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    console.log('📧 Entering email...');
    await page.fill('input[type="email"]', 'ben.howard@stoke.nhs.uk');
    
    console.log('🔒 Entering password...');  
    await page.fill('input[type="password"]', 'Hello1!');
    
    await page.screenshot({ path: 'step2_credentials.png' });
    console.log('📸 Credentials entered screenshot saved');
    
    console.log('🖱️ Clicking login...');
    await page.click('button[type="submit"]');
    
    // Wait for navigation/login
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'step3_after_login.png' });
    console.log('📸 After login screenshot saved');
    
    console.log('🎓 Looking for training section...');
    const trainingBtn = page.locator('button[data-section="training"]');
    await trainingBtn.click();
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'step4_training_page.png' });
    console.log('📸 Training page screenshot saved');
    
    // Check for the specific issue
    console.log('🔍 Checking for loading message...');
    const loadingText = await page.locator('td:has-text("Loading training matrix")').count();
    const hasData = await page.locator('#training-tbody tr').count();
    
    console.log(`Found ${loadingText} loading messages`);
    console.log(`Found ${hasData} table rows`);
    
    if (loadingText > 0) {
      console.log('❌ ISSUE EXISTS: Still showing "Loading training matrix..."');
    } else {
      console.log('✅ SUCCESS: No loading message found!');
    }
    
    await page.screenshot({ path: 'final_result.png' });
    console.log('📸 Final result screenshot saved');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

quickTest();