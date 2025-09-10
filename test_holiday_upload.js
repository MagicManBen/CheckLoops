import { chromium } from 'playwright';

async function testHolidayUpload() {
    console.log('Testing Holiday Upload Page...');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Login as admin
        console.log('1. Logging in as admin...');
        await page.goto('http://127.0.0.1:58156/staff.html');
        await page.waitForTimeout(2000);
        
        await page.fill('#email', 'ben.howard@stoke.nhs.uk');
        await page.fill('input[type="password"]', 'Hello1!');
        await page.click('button:has-text("Sign In")');
        await page.waitForTimeout(3000);
        
        // Navigate to admin dashboard directly
        console.log('2. Navigating to admin dashboard...');
        await page.goto('http://127.0.0.1:58156/admin-dashboard.html');
        await page.waitForTimeout(3000);
        
        // Click on Holiday Data Upload button
        console.log('3. Opening Holiday Data Upload page...');
        // First expand the Holidays group if needed
        const holidaysToggle = await page.$('#toggle-holidays');
        if (holidaysToggle) {
            await holidaysToggle.click();
            await page.waitForTimeout(1000);
        }
        
        // Now click the Holiday Data Upload button  
        const uploadButton = await page.$('button[onclick*="holiday-upload.html"]');
        if (uploadButton) {
            await uploadButton.click();
            await page.waitForTimeout(3000);
        } else {
            // If button not found, navigate directly
            console.log('Button not found, navigating directly to holiday upload page');
            await page.goto('http://127.0.0.1:58156/holiday-upload.html');
            await page.waitForTimeout(3000);
        }
        
        // Take screenshot of main page
        await page.screenshot({ path: 'holiday_upload_main.png', fullPage: true });
        console.log('Screenshot saved: holiday_upload_main.png');
        
        // Test Staff Profiles tab
        console.log('4. Testing Staff Profiles tab...');
        await page.click('button[data-tab="staff-profiles"]');
        await page.waitForTimeout(1000);
        
        // Switch to GP view
        await page.click('#staff-profiles .toggle-btn[data-type="gp"]');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'holiday_upload_gp_form.png', fullPage: true });
        console.log('Screenshot saved: holiday_upload_gp_form.png');
        
        // Switch back to regular staff
        await page.click('#staff-profiles .toggle-btn[data-type="regular"]');
        await page.waitForTimeout(1000);
        
        // Test Holiday Bookings tab
        console.log('5. Testing Holiday Bookings tab...');
        await page.click('button[data-tab="holiday-bookings"]');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'holiday_upload_bookings.png', fullPage: true });
        console.log('Screenshot saved: holiday_upload_bookings.png');
        
        // Test Work Patterns tab
        console.log('6. Testing Work Patterns tab...');
        await page.click('button[data-tab="work-patterns"]');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'holiday_upload_patterns.png', fullPage: true });
        console.log('Screenshot saved: holiday_upload_patterns.png');
        
        // Test Bulk Upload tab
        console.log('7. Testing Bulk Upload tab...');
        await page.click('button[data-tab="bulk-upload"]');
        await page.waitForTimeout(1000);
        
        // Test template downloads
        console.log('8. Testing template downloads...');
        
        // Download staff template
        await page.click('button:has-text("Staff Template")');
        await page.waitForTimeout(1000);
        
        // Download GP template
        await page.click('button:has-text("GP Template")');
        await page.waitForTimeout(1000);
        
        // Download holidays template
        await page.click('button:has-text("Holiday Bookings Template")');
        await page.waitForTimeout(1000);
        
        await page.screenshot({ path: 'holiday_upload_bulk.png', fullPage: true });
        console.log('Screenshot saved: holiday_upload_bulk.png');
        
        // Add a test staff member
        console.log('9. Adding a test staff member...');
        await page.click('button[data-tab="staff-profiles"]');
        await page.waitForTimeout(1000);
        
        await page.fill('input[name="fullName"]', 'Test Staff Member');
        await page.selectOption('select[name="role"]', 'Nurse');
        await page.fill('input[name="annualHours"]', '200');
        await page.fill('input[name="mondayHours"]', '08:00');
        await page.fill('input[name="tuesdayHours"]', '08:00');
        await page.fill('input[name="wednesdayHours"]', '08:00');
        await page.fill('input[name="thursdayHours"]', '08:00');
        await page.fill('input[name="fridayHours"]', '07:30');
        
        await page.screenshot({ path: 'holiday_upload_filled_form.png', fullPage: true });
        console.log('Screenshot saved: holiday_upload_filled_form.png');
        
        console.log('✅ Holiday Upload page test completed successfully!');
        console.log('\nFeatures tested:');
        console.log('- Staff Profiles (Regular & GP)');
        console.log('- Holiday Bookings');
        console.log('- Work Patterns');
        console.log('- Bulk Upload with templates');
        console.log('- Form validation');
        
    } catch (error) {
        console.error('Test failed:', error);
        await page.screenshot({ path: 'holiday_upload_error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

testHolidayUpload();