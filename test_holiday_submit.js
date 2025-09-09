import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  'https://unveoqnlqnobufhublyw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME'
);

async function testHolidaySubmission() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('\n=== Testing Holiday Request Submission ===\n');
  
  try {
    // Login as staff
    console.log('1. Logging in as staff...');
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Navigate to holidays page
    await page.goto('http://127.0.0.1:58156/staff-holidays.html');
    await page.waitForTimeout(3000);
    
    // Open request modal
    console.log('2. Opening holiday request form...');
    await page.locator('button:has-text("Request Holiday")').click();
    await page.waitForTimeout(1000);
    
    // Fill in holiday request
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 30); // 30 days from now
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 37); // 37 days from now (7 day holiday)
    
    console.log('3. Filling holiday request form...');
    await page.locator('#start-date').fill(startDate.toISOString().split('T')[0]);
    await page.locator('#end-date').fill(endDate.toISOString().split('T')[0]);
    await page.locator('#request-type').selectOption('holiday');
    await page.locator('#destination').fill('Paris, France');
    
    console.log('  - Start date:', startDate.toISOString().split('T')[0]);
    console.log('  - End date:', endDate.toISOString().split('T')[0]);
    console.log('  - Destination: Paris, France');
    
    // Submit the request
    console.log('4. Submitting holiday request...');
    await page.locator('#holiday-request-form button:has-text("Submit Request")').click();
    await page.waitForTimeout(3000);
    
    // Check if request was submitted (modal should close)
    const isModalStillVisible = await page.locator('#request-modal').isVisible();
    console.log('  - Modal closed after submission?', !isModalStillVisible);
    
    // Refresh the page to see new request
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Check if the request appears in the list
    const holidayItems = await page.locator('.holiday-item').count();
    console.log('  - Number of holiday requests visible:', holidayItems);
    
    // Check database directly
    console.log('\n5. Verifying in Supabase database...');
    
    // Get the user's auth session from the page
    const userEmail = await page.evaluate(() => {
      const emailPill = document.getElementById('email-pill');
      return emailPill ? emailPill.textContent : null;
    });
    
    console.log('  - User email:', userEmail);
    
    // Query the database for recent holiday requests
    const { data: requests, error } = await supabase
      .from('holiday_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('  - Error querying database:', error);
    } else {
      console.log('  - Recent holiday requests in database:', requests?.length || 0);
      
      // Find our test request
      const testRequest = requests?.find(r => 
        r.destination === 'Paris, France' &&
        r.start_date === startDate.toISOString().split('T')[0]
      );
      
      if (testRequest) {
        console.log('  ✅ Holiday request found in database!');
        console.log('    - ID:', testRequest.id);
        console.log('    - Status:', testRequest.status);
        console.log('    - Type:', testRequest.request_type);
        console.log('    - Total hours:', testRequest.total_hours);
        console.log('    - Total sessions:', testRequest.total_sessions);
      } else {
        console.log('  ⚠️ Test request not found in recent database entries');
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test_holiday_submitted.png', fullPage: true });
    console.log('\n6. Screenshot saved: test_holiday_submitted.png');
    
  } catch (error) {
    console.error('Error during testing:', error);
    await page.screenshot({ path: 'test_submission_error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n=== Test Complete ===\n');
  }
}

testHolidaySubmission().catch(console.error);