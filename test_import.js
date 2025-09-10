import { chromium } from 'playwright';

async function testImport() {
    console.log('Starting holiday data import test...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Navigate to the import page
        await page.goto('file://' + process.cwd() + '/complete_import.html');
        await page.waitForTimeout(2000);
        
        // Take initial screenshot
        await page.screenshot({ path: 'import_initial.png', fullPage: true });
        console.log('Initial screenshot saved');
        
        // Click setup tables button
        await page.click('#setupBtn');
        await page.waitForTimeout(3000);
        
        // Click import button
        await page.click('#importBtn');
        console.log('Import started...');
        
        // Wait for import to complete (monitor the log)
        await page.waitForTimeout(10000);
        
        // Take screenshot after import
        await page.screenshot({ path: 'import_completed.png', fullPage: true });
        console.log('Import completed screenshot saved');
        
        // Click verify button
        await page.click('#verifyBtn');
        await page.waitForTimeout(3000);
        
        // Get the stats
        const profileCount = await page.textContent('#profileCount');
        const bookingCount = await page.textContent('#bookingCount');
        const entitlementCount = await page.textContent('#entitlementCount');
        const linkedCount = await page.textContent('#linkedCount');
        
        console.log('Import Results:');
        console.log(`- Staff Profiles: ${profileCount}`);
        console.log(`- Holiday Bookings: ${bookingCount}`);
        console.log(`- Entitlements: ${entitlementCount}`);
        console.log(`- Linked Users: ${linkedCount}`);
        
        // Get log content
        const logContent = await page.textContent('#log');
        console.log('\nImport Log:');
        console.log(logContent);
        
        // Now test the staff page to see if data is visible
        console.log('\nTesting staff page...');
        await page.goto('http://127.0.0.1:58156/staff.html');
        await page.waitForTimeout(2000);
        
        // Login as Ben Howard
        await page.fill('#email', 'ben.howard@stoke.nhs.uk');
        await page.fill('input[type="password"]', 'Hello1!');
        await page.click('button:has-text("Sign In")');
        await page.waitForTimeout(3000);
        
        // Navigate to holiday section if available
        const holidayButton = await page.$('button[data-section="holiday"]');
        if (holidayButton) {
            await holidayButton.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'staff_holiday_view.png', fullPage: true });
            console.log('Staff holiday view screenshot saved');
        }
        
        console.log('\nImport test completed successfully!');
        
    } catch (error) {
        console.error('Test failed:', error);
        await page.screenshot({ path: 'error_screenshot.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

testImport();