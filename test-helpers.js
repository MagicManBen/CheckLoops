import { chromium } from 'playwright';

/**
 * Standard login flow for CheckLoop application
 * @param {Page} page - Playwright page object
 * @param {Object} credentials - Login credentials
 * @returns {Promise<boolean>} - Success status
 */
export async function loginToCheckLoop(page, credentials = {}) {
  const email = credentials.email || 'ben.howard@stoke.nhs.uk';
  const password = credentials.password || 'Hello1!';
  
  try {
    console.log('🔐 Logging into CheckLoop...');
    await page.goto('http://127.0.0.1:58156/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    await page.locator('#email').clear();
    await page.locator('#email').fill(email);
    
    await page.locator('input[type="password"]').first().clear();
    await page.locator('input[type="password"]').first().fill(password);
    
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Check if login was successful by looking for navigation or dashboard
    const hasNavigation = await page.locator('button[data-section]').count() > 0;
    
    if (hasNavigation) {
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed - no navigation found');
      await page.screenshot({ path: 'login_failed.png' });
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    await page.screenshot({ path: 'login_error.png' });
    return false;
  }
}

/**
 * Navigate to a specific section in CheckLoop
 * @param {Page} page - Playwright page object  
 * @param {string} section - Section name (training, dashboard, etc.)
 * @returns {Promise<boolean>} - Success status
 */
export async function navigateToSection(page, section) {
  try {
    console.log(`🧭 Navigating to ${section} section...`);
    const sectionButton = page.locator(`button[data-section="${section}"]`);
    
    if (await sectionButton.count() === 0) {
      console.log(`❌ Section button not found: ${section}`);
      return false;
    }
    
    await sectionButton.click();
    await page.waitForTimeout(2000);
    
    console.log(`✅ Navigated to ${section}`);
    return true;
  } catch (error) {
    console.error(`❌ Navigation error:`, error.message);
    return false;
  }
}

/**
 * Create a browser instance with standard settings
 * @param {Object} options - Browser options
 * @returns {Promise<Browser>} - Browser instance
 */
export async function createBrowser(options = {}) {
  return await chromium.launch({
    headless: options.headless || false,
    slowMo: options.slowMo || 500,
    ...options
  });
}

/**
 * Standard test wrapper that handles browser lifecycle
 * @param {string} testName - Name of the test
 * @param {Function} testFunction - Test function to execute
 * @param {Object} browserOptions - Browser options
 */
export async function runTest(testName, testFunction, browserOptions = {}) {
  console.log(`🧪 Starting test: ${testName}`);
  
  let browser;
  try {
    browser = await createBrowser(browserOptions);
    const page = await browser.newPage();
    
    const result = await testFunction(page);
    
    if (result) {
      console.log(`✅ Test passed: ${testName}`);
    } else {
      console.log(`❌ Test failed: ${testName}`);
    }
    
    return result;
  } catch (error) {
    console.error(`💥 Test error in ${testName}:`, error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}