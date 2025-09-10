import { chromium } from 'playwright';

async function testHolidayUploadDirect() {
    console.log('Testing Holiday Upload Page (Direct Access)...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Go directly to holiday upload page
        console.log('1. Navigating directly to holiday upload page...');
        await page.goto('http://127.0.0.1:58156/holiday-upload.html');
        await page.waitForTimeout(3000);
        
        // Take screenshot of main page
        await page.screenshot({ path: 'holiday_upload_direct.png', fullPage: true });
        console.log('Screenshot saved: holiday_upload_direct.png');
        
        // Check if we're redirected
        const currentUrl = page.url();
        console.log('Current URL:', currentUrl);
        
        if (!currentUrl.includes('holiday-upload.html')) {
            console.log('⚠️  Page redirected, likely authentication required');
            
            // Try logging in first
            console.log('2. Attempting login...');
            await page.fill('#email', 'ben.howard@stoke.nhs.uk');
            await page.fill('input[type="password"]', 'Hello1!');
            await page.click('button:has-text("Sign In")');
            await page.waitForTimeout(3000);
            
            // Now try to navigate to holiday upload again
            console.log('3. Navigating to holiday upload after login...');
            await page.goto('http://127.0.0.1:58156/holiday-upload.html');
            await page.waitForTimeout(3000);
            
            await page.screenshot({ path: 'holiday_upload_after_login.png', fullPage: true });
            console.log('Screenshot saved: holiday_upload_after_login.png');
        }
        
        // Check if the page loaded correctly
        const pageTitle = await page.textContent('h1');
        console.log('Page title:', pageTitle);
        
        // Check for tabs
        const tabs = await page.$$('.tab-button');
        console.log(`Found ${tabs.length} tabs`);
        
        if (tabs.length > 0) {
            console.log('✅ Holiday Upload page loaded successfully!');
            
            // Test each tab
            for (let i = 0; i < tabs.length; i++) {
                const tabText = await tabs[i].textContent();
                console.log(`  Tab ${i + 1}: ${tabText}`);
            }
            
            // Test Staff Profiles tab
            console.log('\n4. Testing Staff Profiles functionality...');
            const staffTab = await page.$('button[data-tab="staff-profiles"]');
            if (staffTab) {
                await staffTab.click();
                await page.waitForTimeout(1000);
                console.log('  ✓ Staff Profiles tab clicked');
            }
            
            // Test Bulk Upload tab
            console.log('\n5. Testing Bulk Upload functionality...');
            const bulkTab = await page.$('button[data-tab="bulk-upload"]');
            if (bulkTab) {
                await bulkTab.click();
                await page.waitForTimeout(1000);
                console.log('  ✓ Bulk Upload tab clicked');
                
                // Check for download buttons
                const downloadButtons = await page.$$('button:has-text("Template")');
                console.log(`  Found ${downloadButtons.length} template download buttons`);
            }
            
            await page.screenshot({ path: 'holiday_upload_final.png', fullPage: true });
            console.log('\nFinal screenshot saved: holiday_upload_final.png');
            
        } else {
            console.log('❌ Holiday Upload page did not load correctly');
        }
        
    } catch (error) {
        console.error('Test failed:', error);
        await page.screenshot({ path: 'holiday_upload_error_direct.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

testHolidayUploadDirect();