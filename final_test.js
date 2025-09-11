import { chromium } from 'playwright';

const TEST_URL = 'http://127.0.0.1:65046/home.html';
const ADMIN_EMAIL = 'ben.howard@stoke.nhs.uk';
const STAFF_EMAIL = 'benhowardmagic@hotmail.com';
const PASSWORD = 'Hello1!';

const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testLogin(page, email, password, role) {
  try {
    console.log(`\n🔐 Testing ${role} Login...`);
    await page.goto(TEST_URL);
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(PASSWORD);
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation
    await page.waitForURL('**/staff.html', { timeout: 10000 });
    console.log(`✅ ${role} login successful - redirected to staff.html`);
    testResults.passed.push(`${role} Login`);
    return true;
  } catch (error) {
    console.error(`❌ ${role} login failed:`, error.message);
    testResults.failed.push(`${role} Login: ${error.message}`);
    return false;
  }
}

async function testMeetingMinutes(page) {
  try {
    console.log('\n📅 Testing Meeting Minutes...');
    
    // Check if calendar exists
    const calendar = await page.$('#calendar');
    if (calendar) {
      console.log('✅ Calendar found');
      testResults.passed.push('Meeting Calendar');
    } else {
      testResults.warnings.push('Meeting calendar not visible');
    }
    
    // Check agenda submission
    const agendaInput = await page.$('#agenda-item-title');
    if (agendaInput) {
      console.log('✅ Agenda submission form found');
      testResults.passed.push('Agenda Submission');
    }
    
    // Check recording upload
    const recordingInput = await page.$('#meeting-recording');
    if (recordingInput) {
      console.log('✅ Recording upload feature found');
      testResults.passed.push('Meeting Recording Upload');
    } else {
      testResults.failed.push('Meeting Recording Upload missing');
    }
    
    // Check PDF generation button
    const pdfButton = await page.$('button:has-text("Generate PDF")');
    if (pdfButton) {
      console.log('✅ PDF generation with AI found');
      testResults.passed.push('Meeting PDF Generation');
    }
    
  } catch (error) {
    console.error('❌ Meeting minutes test error:', error.message);
    testResults.failed.push(`Meeting Minutes: ${error.message}`);
  }
}

async function testHolidaySystem(page) {
  try {
    console.log('\n🏖️ Testing Holiday System...');
    
    // Navigate to holidays
    const holidayLink = await page.$('a[href="staff-holidays.html"]');
    if (holidayLink) {
      await holidayLink.click();
      await page.waitForTimeout(2000);
      console.log('✅ Holiday navigation works');
      testResults.passed.push('Holiday Navigation');
      
      // Check for request button
      const requestBtn = await page.$('button:has-text("Request Holiday"), button:has-text("New Request")');
      if (requestBtn) {
        console.log('✅ Holiday request button found');
        testResults.passed.push('Holiday Request Form');
      }
      
      // Check for destination field
      const destinationField = await page.$('input[id*="destination"], input[placeholder*="destination"]');
      if (destinationField) {
        console.log('✅ Destination input found (for AI avatar generation)');
        testResults.passed.push('Holiday Destination Field');
      }
      
      // Go back to staff page
      await page.goto('http://127.0.0.1:65046/staff.html');
    } else {
      testResults.failed.push('Holiday Navigation - link not found');
    }
    
  } catch (error) {
    console.error('❌ Holiday system test error:', error.message);
    testResults.failed.push(`Holiday System: ${error.message}`);
  }
}

async function testAchievements(page) {
  try {
    console.log('\n🏆 Testing Achievements System...');
    
    // Check if achievements section exists
    const achievementsSection = await page.$('.achievements-grid, [class*="achievement"]');
    if (achievementsSection) {
      console.log('✅ Achievements section found');
      testResults.passed.push('Achievements Display');
      
      // Check for specific achievement cards
      const achievementCards = await page.$$('.ach-card, .achievement-card');
      if (achievementCards.length > 0) {
        console.log(`✅ Found ${achievementCards.length} achievement cards`);
        testResults.passed.push(`Achievements: ${achievementCards.length} cards`);
      }
    } else {
      testResults.warnings.push('Achievements section not immediately visible');
    }
    
  } catch (error) {
    console.error('❌ Achievements test error:', error.message);
    testResults.failed.push(`Achievements: ${error.message}`);
  }
}

async function testAdminAccess(page) {
  try {
    console.log('\n👨‍💼 Testing Admin Access...');
    
    // Check for admin button
    const adminButton = await page.$('a[href="admin-dashboard.html"], #admin-access-panel');
    if (adminButton && await adminButton.isVisible()) {
      console.log('✅ Admin button visible for admin user');
      testResults.passed.push('Admin Button Visibility');
      
      // Try to navigate to admin dashboard
      await adminButton.click();
      await page.waitForTimeout(3000);
      
      if (page.url().includes('admin-dashboard.html')) {
        console.log('✅ Successfully navigated to admin dashboard');
        testResults.passed.push('Admin Dashboard Access');
        
        // Go back to staff page
        await page.goto('http://127.0.0.1:65046/staff.html');
      }
    } else {
      testResults.warnings.push('Admin button not immediately visible');
    }
    
  } catch (error) {
    console.error('❌ Admin access test error:', error.message);
    testResults.failed.push(`Admin Access: ${error.message}`);
  }
}

async function testFontColors(page) {
  try {
    console.log('\n🎨 Testing Font Colors...');
    
    // Check for black text on dark backgrounds
    const selects = await page.$$('select');
    for (const select of selects) {
      const color = await select.evaluate(el => window.getComputedStyle(el).color);
      const bgColor = await select.evaluate(el => window.getComputedStyle(el).backgroundColor);
      
      if (color === 'rgb(0, 0, 0)' && bgColor !== 'rgba(0, 0, 0, 0)') {
        testResults.warnings.push(`Potential black font issue on select element`);
      }
    }
    
    console.log('✅ Font color check complete');
    testResults.passed.push('Font Color Check');
    
  } catch (error) {
    console.error('❌ Font color test error:', error.message);
    testResults.failed.push(`Font Colors: ${error.message}`);
  }
}

async function runAllTests() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  console.log('🚀 STARTING COMPREHENSIVE SYSTEM TEST\n');
  console.log('=' .repeat(50));
  
  try {
    // Test Admin User Journey
    console.log('\n📋 ADMIN USER TESTS');
    console.log('-'.repeat(30));
    
    let page = await browser.newPage();
    
    if (await testLogin(page, ADMIN_EMAIL, PASSWORD, 'Admin')) {
      await testMeetingMinutes(page);
      await testHolidaySystem(page);
      await testAchievements(page);
      await testAdminAccess(page);
      await testFontColors(page);
    }
    
    await page.close();
    
    // Test Staff User Journey
    console.log('\n📋 STAFF USER TESTS');
    console.log('-'.repeat(30));
    
    page = await browser.newPage();
    
    if (await testLogin(page, STAFF_EMAIL, PASSWORD, 'Staff')) {
      // Check admin button should NOT be visible
      const adminButton = await page.$('a[href="admin-dashboard.html"], #admin-access-panel');
      if (adminButton) {
        const isVisible = await adminButton.isVisible();
        if (!isVisible) {
          console.log('✅ Admin button correctly hidden for staff user');
          testResults.passed.push('Staff Permission Check');
        } else {
          testResults.failed.push('Admin button visible to staff (should be hidden)');
        }
      }
    }
    
    await page.close();
    
  } catch (error) {
    console.error('Fatal test error:', error);
    testResults.failed.push(`Fatal Error: ${error.message}`);
  } finally {
    await browser.close();
  }
  
  // Print Final Report
  console.log('\n' + '='.repeat(50));
  console.log('📊 FINAL TEST REPORT');
  console.log('='.repeat(50));
  
  console.log(`\n✅ PASSED (${testResults.passed.length}):`);
  testResults.passed.forEach(test => console.log(`   • ${test}`));
  
  if (testResults.warnings.length > 0) {
    console.log(`\n⚠️ WARNINGS (${testResults.warnings.length}):`);
    testResults.warnings.forEach(warning => console.log(`   • ${warning}`));
  }
  
  if (testResults.failed.length > 0) {
    console.log(`\n❌ FAILED (${testResults.failed.length}):`);
    testResults.failed.forEach(failure => console.log(`   • ${failure}`));
  }
  
  const totalTests = testResults.passed.length + testResults.failed.length;
  const passRate = Math.round((testResults.passed.length / totalTests) * 100);
  
  console.log('\n' + '='.repeat(50));
  console.log(`OVERALL: ${passRate}% Pass Rate (${testResults.passed.length}/${totalTests} tests)`);
  
  if (passRate === 100) {
    console.log('🎉 ALL TESTS PASSED! System is ready for launch!');
  } else if (passRate >= 80) {
    console.log('✅ System is mostly functional. Address failures before launch.');
  } else {
    console.log('⚠️ Critical issues detected. Fix failures before launch.');
  }
}

// Run the tests
runAllTests().catch(console.error);
