import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  headless: false,
  slowMo: 200
});
const page = await browser.newPage();

page.on('console', msg => {
  const text = msg.text();
  if (text.includes('Loading simple training matrix') || text.includes('Loaded:') || text.includes('rendered successfully')) {
    console.log('✅', text);
  }
});

try {
  console.log('1. Going directly to index.html...');
  await page.goto('http://127.0.0.1:5500/index.html');
  await page.waitForTimeout(2000);
  
  console.log('2. Filling login form...');
  // Use more specific selectors
  await page.locator('#auth-email').fill('ben.howard@stoke.nhs.uk');
  await page.locator('#auth-password').fill('Hello1!');
  
  console.log('3. Clicking Sign In...');
  await page.locator('#auth-form button[type="submit"]').click();
  
  console.log('4. Waiting for dashboard to load...');
  await page.waitForTimeout(8000);
  
  // Take a screenshot to see where we are
  await page.screenshot({ path: 'after_login.png' });
  
  // Check if we're logged in by looking for the sidebar
  const sidebarVisible = await page.locator('nav button').first().isVisible().catch(() => false);
  
  if (sidebarVisible) {
    console.log('5. Dashboard loaded! Expanding Checks & Audits...');
    await page.locator('#toggle-checks').click();
    await page.waitForTimeout(500);
    
    console.log('6. Clicking Training Tracker...');
    await page.locator('button[data-section="training"]').click();
    
    console.log('7. Waiting for training matrix...');
    await page.waitForTimeout(5000);
    
    // Check the result
    const tbody = await page.locator('#training-tbody');
    const tableText = await tbody.innerText();
    
    if (tableText.includes('Loading')) {
      console.log('❌ Matrix still loading');
    } else if (tableText.includes('Error')) {
      console.log('❌ Matrix has error:', tableText);
    } else {
      console.log('✅ TRAINING MATRIX LOADED!');
      
      const rows = await tbody.locator('tr').count();
      const firstRow = await tbody.locator('tr').first().innerText();
      
      console.log(`   Found ${rows} staff members`);
      console.log(`   First row: ${firstRow.substring(0, 80)}...`);
      
      // Count training type columns
      const headers = await page.locator('#training-headers th').count();
      console.log(`   Matrix has ${headers} columns (1 name + ${headers-1} training types)`);
    }
    
    await page.screenshot({ path: 'training_matrix_loaded.png', fullPage: true });
    console.log('📸 Final screenshot: training_matrix_loaded.png');
    
    console.log('\n8. Testing Non-Clinical tab...');
    await page.locator('button:has-text("Non-Clinical")').click();
    await page.waitForTimeout(3000);
    
    const nonClinicalText = await tbody.innerText();
    if (!nonClinicalText.includes('Loading')) {
      console.log('✅ Non-Clinical tab also works!');
    }
  } else {
    console.log('❌ Login failed or dashboard not loaded');
  }
  
  await page.waitForTimeout(3000);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  await page.screenshot({ path: 'error_state.png' });
} finally {
  await browser.close();
  console.log('\nTest complete');
}
