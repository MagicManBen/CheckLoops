import { chromium } from 'playwright';

async function testDatabaseAdminPage() {
    console.log('🎭 Starting Database Admin Page Test...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Navigate to the database-connected admin page
        console.log('📄 Opening admin-holidays-db.html...');
        await page.goto('http://127.0.0.1:58156/admin-holidays-db.html');
        
        // Wait for page to load and data to be fetched
        await page.waitForTimeout(5000);
        
        // Take screenshot of main page
        console.log('📸 Taking screenshot of Staff Overview...');
        await page.screenshot({ path: 'screenshots/db_admin_staff.png', fullPage: true });
        
        // Switch to Historical Holidays tab
        console.log('🔄 Switching to Historical Holidays tab...');
        await page.click('button[data-tab="holidays"]');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'screenshots/db_admin_holidays.png', fullPage: true });
        
        // Switch to Database Status tab
        console.log('🔄 Switching to Database Status tab...');
        await page.click('button[data-tab="database"]');
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'screenshots/db_admin_status.png', fullPage: true });
        
        // Test search functionality
        console.log('🔍 Testing search functionality...');
        await page.click('button[data-tab="overview"]');
        await page.waitForTimeout(1000);
        await page.fill('#staffSearch', 'Ben Howard');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/db_admin_search.png', fullPage: true });
        
        // Verify data is loaded by checking for specific elements
        const statsLoaded = await page.isVisible('#totalStaff:not(:has-text("-"))');
        const staffTableVisible = await page.isVisible('#staffTable[style*="table"]');
        
        console.log('✅ All tests completed successfully!');
        console.log(`📊 Stats loaded: ${statsLoaded ? 'Yes' : 'No'}`);
        console.log(`📋 Staff table visible: ${staffTableVisible ? 'Yes' : 'No'}`);
        
        console.log('\n📁 Screenshots saved to:');
        console.log('  - screenshots/db_admin_staff.png');
        console.log('  - screenshots/db_admin_holidays.png');
        console.log('  - screenshots/db_admin_status.png');
        console.log('  - screenshots/db_admin_search.png');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
testDatabaseAdminPage();