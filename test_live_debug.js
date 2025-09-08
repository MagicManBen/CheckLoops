import { chromium } from 'playwright';

async function debugLiveSite() {
  console.log('Debugging live site...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to live site
    console.log('1. Opening GitHub Pages site...');
    await page.goto('https://magicmanben.github.io/CheckLoops/');
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'debug_1_initial.png' });
    console.log('Initial screenshot saved');
    
    // Try to login
    console.log('\n2. Attempting login...');
    const emailField = await page.locator('#email').isVisible();
    console.log(`Email field visible: ${emailField}`);
    
    if (emailField) {
      await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
      await page.locator('#password').fill('Hello1!');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
      
      // Check if login succeeded
      await page.screenshot({ path: 'debug_2_after_login.png' });
      console.log('After login screenshot saved');
      
      // Check what's visible on the page
      console.log('\n3. Checking page elements...');
      
      // Check for nav buttons
      const navButtons = await page.locator('button[data-section]').all();
      console.log(`Found ${navButtons.length} navigation buttons`);
      
      for (let i = 0; i < Math.min(navButtons.length, 5); i++) {
        const text = await navButtons[i].textContent();
        const isVisible = await navButtons[i].isVisible();
        console.log(`  Button ${i}: "${text}" - Visible: ${isVisible}`);
      }
      
      // Check for sidebar nav
      const sidebarButtons = await page.locator('.sidebar button').all();
      console.log(`\nFound ${sidebarButtons.length} sidebar buttons`);
      
      for (let i = 0; i < Math.min(sidebarButtons.length, 5); i++) {
        const text = await sidebarButtons[i].textContent();
        const isVisible = await sidebarButtons[i].isVisible();
        console.log(`  Sidebar ${i}: "${text}" - Visible: ${isVisible}`);
      }
      
      // Check current URL
      console.log(`\nCurrent URL: ${page.url()}`);
      
      // Check for any error messages
      const errorMessages = await page.locator('.error, .alert').all();
      if (errorMessages.length > 0) {
        console.log('\nError messages found:');
        for (const error of errorMessages) {
          const text = await error.textContent();
          console.log(`  - ${text}`);
        }
      }
      
      // Try alternative navigation
      console.log('\n4. Trying to navigate to Training...');
      
      // Try clicking Training in sidebar
      const trainingSidebarBtn = page.locator('.sidebar button:has-text("Training")');
      if (await trainingSidebarBtn.count() > 0) {
        console.log('Found Training button in sidebar, clicking...');
        await trainingSidebarBtn.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'debug_3_training.png' });
        console.log('Training screenshot saved');
      }
      
      // Check training matrix elements
      const trainingCells = await page.locator('.training-cell').all();
      console.log(`\nFound ${trainingCells.length} training cells`);
      
      if (trainingCells.length > 0) {
        console.log('Clicking first training cell...');
        await trainingCells[0].click();
        await page.waitForTimeout(1000);
        
        // Check drawer
        const drawer = page.locator('#cell-drawer');
        const drawerVisible = await drawer.isVisible();
        console.log(`Drawer visible: ${drawerVisible}`);
        
        if (drawerVisible) {
          // Check drawer content
          const drawerContent = await drawer.textContent();
          console.log(`Drawer content preview: ${drawerContent.substring(0, 200)}...`);
          
          // Look for edit button
          const editButtons = await page.locator('button:has-text("Edit")').all();
          console.log(`\nFound ${editButtons.length} edit buttons`);
          for (const btn of editButtons) {
            const text = await btn.textContent();
            const visible = await btn.isVisible();
            console.log(`  - "${text}" - Visible: ${visible}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'debug_error.png' });
  } finally {
    console.log('\nKeeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

debugLiveSite();