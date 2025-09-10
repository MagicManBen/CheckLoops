import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testHolidayPage() {
  console.log('🎭 Starting Holiday Page Test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for visibility
  });
  
  const page = await browser.newPage();
  
  try {
    // Test the fixed page
    console.log('📄 Opening admin-holidays-fixed.html...');
    await page.goto(`file://${__dirname}/admin-holidays-fixed.html`);
    await page.waitForTimeout(2000);
    
    // Take screenshot of overview
    console.log('📸 Taking screenshot of Staff Overview...');
    await page.screenshot({ 
      path: 'screenshots/holiday_overview.png',
      fullPage: true 
    });
    
    // Click on Historical Holidays tab
    console.log('🔄 Switching to Historical Holidays tab...');
    await page.click('button:has-text("Historical Holidays")');
    await page.waitForTimeout(1000);
    
    // Take screenshot of holidays
    console.log('📸 Taking screenshot of Historical Holidays...');
    await page.screenshot({ 
      path: 'screenshots/holiday_historical.png',
      fullPage: true 
    });
    
    // Click on Database Status tab
    console.log('🔄 Switching to Database Status tab...');
    await page.click('button:has-text("Database Status")');
    await page.waitForTimeout(2000); // Wait for connection check
    
    // Take screenshot of database status
    console.log('📸 Taking screenshot of Database Status...');
    await page.screenshot({ 
      path: 'screenshots/holiday_database.png',
      fullPage: true 
    });
    
    // Test search functionality
    console.log('🔍 Testing search...');
    await page.click('button:has-text("Staff Overview")');
    await page.fill('#searchStaff', 'Ben Howard');
    await page.waitForTimeout(500);
    
    // Take screenshot of search results
    console.log('📸 Taking screenshot of search results...');
    await page.screenshot({ 
      path: 'screenshots/holiday_search.png',
      fullPage: true 
    });
    
    // Test admin dashboard page
    console.log('📄 Opening admin dashboard...');
    await page.goto(`file://${__dirname}/admin-dashboard.html`);
    await page.waitForTimeout(2000);
    
    // Click on Holidays menu
    const holidaysToggle = await page.$('#toggle-holidays');
    if (holidaysToggle) {
      await holidaysToggle.click();
      await page.waitForTimeout(500);
      
      console.log('📸 Taking screenshot of admin dashboard with holidays menu...');
      await page.screenshot({ 
        path: 'screenshots/admin_dashboard_holidays.png',
        fullPage: false 
      });
    }
    
    console.log('✅ All tests completed successfully!');
    console.log('\n📁 Screenshots saved to:');
    console.log('  - screenshots/holiday_overview.png');
    console.log('  - screenshots/holiday_historical.png');
    console.log('  - screenshots/holiday_database.png');
    console.log('  - screenshots/holiday_search.png');
    console.log('  - screenshots/admin_dashboard_holidays.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
import fs from 'fs';
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// Run the test
testHolidayPage();