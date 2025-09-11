import { chromium } from 'playwright';

async function testDeactivation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing User Deactivation functionality...');
  
  try {
    // Step 1: Login as admin
    console.log('1. Opening admin page...');
    const adminPath = `file://${process.cwd()}/admin.html`;
    await page.goto(adminPath);
    await page.waitForTimeout(2000);
    
    // Check if already logged in, if not login
    const needsLogin = await page.locator('#email').isVisible().catch(() => false);
    if (needsLogin) {
      console.log('2. Logging in...');
      await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
      await page.locator('#password').fill('Hello1!');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
    } else {
      console.log('2. Already logged in');
    }
    
    // Wait for admin dashboard to load
    await page.waitForSelector('#practice-users-tbody', { timeout: 10000 });
    
    // Step 3: Take screenshot of initial state
    await page.screenshot({ path: 'test_deactivation_1_initial.png', fullPage: true });
    console.log('3. Screenshot saved: test_deactivation_1_initial.png');
    
    // Step 4: Look for active users with Deactivate button
    const deactivateButtons = await page.locator('button:has-text("Deactivate")').all();
    const reactivateButtons = await page.locator('button:has-text("Reactivate")').all();
    
    console.log(`Found ${deactivateButtons.length} active users and ${reactivateButtons.length} deactivated users`);
    
    if (deactivateButtons.length === 0) {
      console.log('⚠️ No active users found to test deactivation');
      return;
    }
    
    // Step 5: Test deactivation
    console.log('4. Testing deactivation...');
    
    // Set up dialog handler for the confirmation
    page.on('dialog', async dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      await dialog.accept();
    });
    
    // Click the first deactivate button
    const firstDeactivateButton = deactivateButtons[0];
    await firstDeactivateButton.click();
    
    // Wait for the operation to complete
    await page.waitForTimeout(3000);
    
    // Look for success message
    const successMessage = await page.locator('.alert.success').textContent().catch(() => null);
    if (successMessage) {
      console.log(`✅ Deactivation Success: ${successMessage}`);
    }
    
    // Take screenshot after deactivation
    await page.screenshot({ path: 'test_deactivation_2_after_deactivate.png', fullPage: true });
    console.log('5. Screenshot saved: test_deactivation_2_after_deactivate.png');
    
    // Step 6: Verify the user now shows as deactivated
    const deactivatedChips = await page.locator('.chip.danger:has-text("Deactivated")').all();
    const newReactivateButtons = await page.locator('button:has-text("Reactivate")').all();
    
    console.log(`Now showing ${deactivatedChips.length} deactivated users and ${newReactivateButtons.length} reactivate buttons`);
    
    if (newReactivateButtons.length > reactivateButtons.length) {
      console.log('✅ User successfully deactivated - Reactivate button now visible');
      
      // Step 7: Test reactivation
      console.log('6. Testing reactivation...');
      await newReactivateButtons[newReactivateButtons.length - 1].click(); // Click the newest reactivate button
      
      // Wait for the operation to complete
      await page.waitForTimeout(3000);
      
      // Look for success message
      const reactivateMessage = await page.locator('.alert.success').textContent().catch(() => null);
      if (reactivateMessage) {
        console.log(`✅ Reactivation Success: ${reactivateMessage}`);
      }
      
      // Take screenshot after reactivation
      await page.screenshot({ path: 'test_deactivation_3_after_reactivate.png', fullPage: true });
      console.log('7. Screenshot saved: test_deactivation_3_after_reactivate.png');
      
      // Verify user is active again
      const finalDeactivateButtons = await page.locator('button:has-text("Deactivate")').all();
      if (finalDeactivateButtons.length >= deactivateButtons.length) {
        console.log('✅ User successfully reactivated - Deactivate button now visible again');
      }
    } else {
      console.log('⚠️ Deactivation may not have worked - no new Reactivate buttons found');
    }
    
    console.log('✅ Deactivation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test_deactivation_error.png', fullPage: true });
    console.log('Error screenshot saved: test_deactivation_error.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testDeactivation().catch(console.error);