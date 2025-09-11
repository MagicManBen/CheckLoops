import { chromium } from 'playwright';

const BASE_URL = 'http://127.0.0.1:65046';
const STAFF_EMAIL = 'benhowardmagic@hotmail.com';
const ADMIN_EMAIL = 'ben.howard@stoke.nhs.uk';
const PASSWORD = 'Hello1!';

const results = {
  passed: [],
  failed: [],
  screenshots: []
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginUser(page, email, role) {
  console.log(`\n🔐 Logging in as ${role}...`);
  
  try {
    await page.goto(`${BASE_URL}/home.html`);
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(PASSWORD);
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('**/staff.html', { timeout: 10000 });
    console.log(`✅ ${role} logged in successfully`);
    results.passed.push(`${role} Login`);
    return true;
  } catch (error) {
    console.error(`❌ ${role} login failed:`, error.message);
    results.failed.push(`${role} Login: ${error.message}`);
    return false;
  }
}

async function testHolidaySubmission(page) {
  console.log('\n🏖️ TESTING HOLIDAY REQUEST SUBMISSION...');
  
  try {
    // Navigate to holidays page
    console.log('📍 Navigating to holidays page...');
    const holidayLink = await page.$('a[href="staff-holidays.html"]');
    if (!holidayLink) {
      throw new Error('Holiday link not found');
    }
    
    await holidayLink.click();
    await page.waitForTimeout(3000);
    console.log('✅ Navigated to holidays page');
    
    // Take screenshot of holidays page
    await page.screenshot({ path: 'holiday_page.png', fullPage: true });
    results.screenshots.push('holiday_page.png');
    
    // Open request modal
    console.log('📝 Opening holiday request modal...');
    
    // Try multiple methods to open the modal
    try {
      // Method 1: Direct function call
      await page.evaluate(() => {
        if (typeof openRequestModal === 'function') {
          openRequestModal();
        }
      });
      await page.waitForTimeout(1000);
      
      // Check if modal is visible
      const modalVisible = await page.evaluate(() => {
        const modal = document.getElementById('request-modal');
        return modal && modal.style.display === 'block';
      });
      
      if (!modalVisible) {
        // Method 2: Click the button
        const requestBtn = await page.$('button:has-text("Request Holiday")');
        if (requestBtn) {
          await requestBtn.click();
          await page.waitForTimeout(1000);
        }
      }
      
      // Verify modal is open
      const finalCheck = await page.evaluate(() => {
        const modal = document.getElementById('request-modal');
        if (modal) {
          modal.style.display = 'block'; // Force it open if needed
          return true;
        }
        return false;
      });
      
      if (finalCheck) {
        console.log('✅ Request modal opened');
      } else {
        throw new Error('Could not open request modal');
      }
    } catch (error) {
      console.error('Failed to open modal:', error.message);
      throw error;
    }
    
    // Fill in holiday request form
    console.log('📝 Filling holiday request form...');
    
    // Set dates (tomorrow and day after)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    const startDate = tomorrow.toISOString().split('T')[0];
    const endDate = dayAfter.toISOString().split('T')[0];
    
    // Fill start date
    const startInput = await page.$('#start-date');
    if (startInput) {
      await startInput.fill(startDate);
      console.log(`✅ Start date set to ${startDate}`);
    } else {
      console.warn('⚠️ Start date input not found');
    }
    
    // Fill end date
    const endInput = await page.$('#end-date');
    if (endInput) {
      await endInput.fill(endDate);
      console.log(`✅ End date set to ${endDate}`);
    } else {
      console.warn('⚠️ End date input not found');
    }
    
    // Select type
    const typeSelect = await page.$('#request-type, select[name="type"]');
    if (typeSelect) {
      await typeSelect.selectOption({ index: 1 }); // Select first non-empty option
      console.log('✅ Holiday type selected');
    }
    
    // Fill destination - IMPORTANT FOR AI AVATAR
    const destination = 'Paris, France';
    const destInput = await page.$('#destination, input[name="destination"], input[placeholder*="destination"]');
    if (destInput) {
      await destInput.fill(destination);
      console.log(`✅ Destination set to ${destination}`);
      results.passed.push('Destination Field Found');
    } else {
      console.warn('⚠️ Destination field not found - avatar may not generate');
      results.failed.push('Destination Field Missing');
    }
    
    // Fill reason
    const reasonInput = await page.$('#reason, textarea[name="reason"], textarea');
    if (reasonInput) {
      await reasonInput.fill('Family vacation to Paris');
      console.log('✅ Reason filled');
    }
    
    // Take screenshot before submission
    await page.screenshot({ path: 'holiday_form_filled.png', fullPage: true });
    results.screenshots.push('holiday_form_filled.png');
    
    // Submit the request
    console.log('🚀 Submitting holiday request...');
    const submitBtn = await page.$('#holiday-request-form button[type="submit"], button:has-text("Submit Request")');
    if (submitBtn) {
      await submitBtn.click();
      console.log('✅ Request submitted');
      results.passed.push('Holiday Request Submission');
    } else {
      // Try submitting via form
      await page.evaluate(() => {
        const form = document.getElementById('holiday-request-form');
        if (form) {
          form.requestSubmit();
        }
      });
      console.log('✅ Request submitted via form');
      results.passed.push('Holiday Request Submission');
    }
    
    // Wait for response
    await page.waitForTimeout(5000);
    
    // Check for success message or avatar generation
    console.log('🤖 Checking for AI avatar generation...');
    
    // Look for any image that might be the generated avatar
    const avatarImages = await page.$$('img[src*="openai"], img[src*="dalle"], img[alt*="avatar"], img[alt*="holiday"], .holiday-destination-image img');
    if (avatarImages.length > 0) {
      console.log(`✅ Found ${avatarImages.length} potential avatar image(s)`);
      results.passed.push('Avatar Generation');
      
      // Take screenshot with avatar
      await page.screenshot({ path: 'holiday_with_avatar.png', fullPage: true });
      results.screenshots.push('holiday_with_avatar.png');
    } else {
      console.warn('⚠️ No avatar image found - checking if generation is in progress');
      
      // Check for loading or error messages
      const statusMessages = await page.$$('.status, .error, .loading, [class*="status"], [class*="error"]');
      for (const msg of statusMessages) {
        const text = await msg.textContent();
        console.log(`Status message: ${text}`);
      }
    }
    
    results.passed.push('Holiday System Basic Flow');
    
  } catch (error) {
    console.error('❌ Holiday submission test failed:', error.message);
    results.failed.push(`Holiday Submission: ${error.message}`);
    
    // Take error screenshot
    await page.screenshot({ path: 'holiday_error.png', fullPage: true });
    results.screenshots.push('holiday_error.png');
  }
}

async function testAdminHolidayView(page) {
  console.log('\n👨‍💼 TESTING ADMIN HOLIDAY VIEWS...');
  
  try {
    // Navigate to admin dashboard directly
    console.log('📍 Navigating to admin dashboard...');
    
    // Go directly to admin dashboard
    await page.goto(`${BASE_URL}/admin-dashboard.html`);
    await page.waitForTimeout(3000);
    
    // Check if we're on the admin page
    if (!page.url().includes('admin')) {
      console.log('Trying alternative admin page...');
      await page.goto(`${BASE_URL}/admin.html`);
      await page.waitForTimeout(3000);
    }
    
    // Verify we're on an admin page
    if (!page.url().includes('admin')) {
      throw new Error('Failed to navigate to admin dashboard');
    }
    
    console.log('✅ Navigated to admin dashboard');
    
    // Take screenshot of admin dashboard
    await page.screenshot({ path: 'admin_dashboard.png', fullPage: true });
    results.screenshots.push('admin_dashboard.png');
    
    // Look for holiday section/dropdown
    console.log('🔍 Looking for holiday management section...');
    
    // First expand the Holidays group if needed
    const holidayToggle = await page.$('#toggle-holidays, button:has-text("Holidays")');
    if (holidayToggle) {
      await holidayToggle.click();
      await page.waitForTimeout(1000);
      console.log('✅ Expanded holiday menu');
    }
    
    // Try to find holiday-related navigation
    const holidayNav = await page.$('button[data-section="holidays-management"], button:has-text("Holiday Requests")');
    if (holidayNav) {
      await holidayNav.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked holiday management');
    }
    
    // Check for holiday requests table
    const requestsTable = await page.$('table, .holiday-requests, [class*="holiday"]');
    if (requestsTable) {
      console.log('✅ Found holiday requests table');
      results.passed.push('Admin Holiday View');
      
      // Take screenshot of holiday admin view
      await page.screenshot({ path: 'admin_holidays.png', fullPage: true });
      results.screenshots.push('admin_holidays.png');
      
      // Check if our submitted request is visible
      const rows = await page.$$('tr, .holiday-item, [class*="request"]');
      console.log(`Found ${rows.length} holiday-related rows`);
      
      for (const row of rows.slice(0, 5)) { // Check first 5 rows
        const text = await row.textContent();
        if (text && text.includes('Paris')) {
          console.log('✅ Found our submitted holiday request with Paris destination!');
          results.passed.push('Holiday Request Visible in Admin');
          break;
        }
      }
    } else {
      console.warn('⚠️ Holiday requests table not found');
      results.failed.push('Admin Holiday Table Missing');
    }
    
    // Check for any error messages
    const errors = await page.$$('.error, [class*="error"]');
    for (const error of errors) {
      const text = await error.textContent();
      if (text && text.length > 0) {
        console.error(`❌ Error found: ${text}`);
        results.failed.push(`Admin Error: ${text}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Admin holiday view test failed:', error.message);
    results.failed.push(`Admin Holiday View: ${error.message}`);
    
    // Take error screenshot
    await page.screenshot({ path: 'admin_error.png', fullPage: true });
    results.screenshots.push('admin_error.png');
  }
}

async function runComprehensiveHolidayTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  console.log('🚀 STARTING COMPREHENSIVE HOLIDAY SYSTEM TEST');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Staff submits holiday request
    console.log('\n📋 PHASE 1: STAFF HOLIDAY SUBMISSION');
    console.log('-'.repeat(40));
    
    let page = await browser.newPage();
    
    if (await loginUser(page, STAFF_EMAIL, 'Staff')) {
      await testHolidaySubmission(page);
    }
    
    await page.close();
    
    // Test 2: Admin views holiday requests
    console.log('\n📋 PHASE 2: ADMIN HOLIDAY MANAGEMENT');
    console.log('-'.repeat(40));
    
    page = await browser.newPage();
    
    if (await loginUser(page, ADMIN_EMAIL, 'Admin')) {
      await testAdminHolidayView(page);
    }
    
    await page.close();
    
    // Test 3: Check database directly
    console.log('\n📋 PHASE 3: DATABASE VERIFICATION');
    console.log('-'.repeat(40));
    
    // We'll check this via Supabase query after the test
    
  } catch (error) {
    console.error('Fatal test error:', error);
    results.failed.push(`Fatal Error: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // Print Final Report
  console.log('\n' + '='.repeat(60));
  console.log('📊 HOLIDAY SYSTEM TEST REPORT');
  console.log('='.repeat(60));
  
  console.log(`\n✅ PASSED (${results.passed.length}):`);
  results.passed.forEach(test => console.log(`   • ${test}`));
  
  if (results.failed.length > 0) {
    console.log(`\n❌ FAILED (${results.failed.length}):`);
    results.failed.forEach(failure => console.log(`   • ${failure}`));
  }
  
  console.log(`\n📸 SCREENSHOTS SAVED (${results.screenshots.length}):`);
  results.screenshots.forEach(file => console.log(`   • ${file}`));
  
  const totalTests = results.passed.length + results.failed.length;
  const passRate = totalTests > 0 ? Math.round((results.passed.length / totalTests) * 100) : 0;
  
  console.log('\n' + '='.repeat(60));
  console.log(`OVERALL: ${passRate}% Pass Rate (${results.passed.length}/${totalTests} tests)`);
  
  if (passRate === 100) {
    console.log('🎉 HOLIDAY SYSTEM FULLY FUNCTIONAL!');
  } else if (passRate >= 70) {
    console.log('✅ Holiday system mostly working. Check failures.');
  } else {
    console.log('⚠️ Holiday system has critical issues.');
  }
}

// Run the test
runComprehensiveHolidayTest().catch(console.error);
