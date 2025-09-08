import { chromium } from 'playwright';

async function testUIFunctionality() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🧪 Testing UI functionality...\n');
    
    // Login
    await page.goto('http://localhost:5173/index.html');
    await page.waitForTimeout(2000);
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Test complaints page UI elements
    console.log('📋 Verifying complaints page elements...');
    await page.click('#toggle-complaints');
    await page.waitForTimeout(1000);
    
    // Check if menu was renamed
    const menuText = await page.locator('button[data-section="complaints-reporting"] .menu-item-label').textContent();
    console.log(`   Menu text: "${menuText}"`);
    if (menuText.includes('Complaints Explorer')) {
      console.log('   ✅ Menu renamed correctly');
    } else {
      console.log('   ❌ Menu not renamed');
    }
    
    await page.click('button[data-section="complaints-reporting"]');
    await page.waitForTimeout(3000);
    
    // Check page title
    const pageTitle = await page.locator('#view-complaints-reporting h3').first().textContent();
    console.log(`   Page title: "${pageTitle}"`);
    if (pageTitle.includes('All Complaints')) {
      console.log('   ✅ Page title correct');
    } else {
      console.log('   ❌ Page title not updated');
    }
    
    // Check if filters exist
    const categoryFilter = await page.locator('#complaints-filter-category').isVisible();
    const statusFilter = await page.locator('#complaints-filter-status').isVisible();
    const searchBox = await page.locator('#complaints-search').isVisible();
    
    console.log(`   Category filter: ${categoryFilter ? '✅' : '❌'}`);
    console.log(`   Status filter: ${statusFilter ? '✅' : '❌'}`);
    console.log(`   Search box: ${searchBox ? '✅' : '❌'}`);
    
    // Check export button
    const exportBtn = await page.locator('#complaints-export').isVisible();
    console.log(`   Export button: ${exportBtn ? '✅' : '❌'}`);
    
    // Check add complaint button
    const addBtn = await page.locator('#btn-new-complaint').isVisible();
    console.log(`   Add Complaint button: ${addBtn ? '✅' : '❌'}`);
    
    // Test complaints dashboard
    console.log('\n🗑️ Testing complaints dashboard...');
    await page.click('button[data-section="complaints-dashboard"]');
    await page.waitForTimeout(2000);
    
    const clearedMessage = await page.locator('text=Dashboard Cleared').isVisible();
    console.log(`   Dashboard cleared message: ${clearedMessage ? '✅' : '❌'}`);
    
    // Test training page
    console.log('\n🎓 Testing training page...');
    await page.click('#toggle-checks');
    await page.waitForTimeout(1000);
    await page.click('button[data-section="training"]');
    await page.waitForTimeout(3000);
    
    const exportTrainingBtn = await page.locator('#btn-export-training').isVisible();
    const manageTypesBtn = await page.locator('#btn-manage-training-types').isVisible();
    
    console.log(`   Export Report button: ${exportTrainingBtn ? '✅' : '❌'}`);
    console.log(`   Manage Training Types button: ${manageTypesBtn ? '✅' : '❌'}`);
    
    // Check if drawer element exists
    const drawerExists = await page.locator('#cell-drawer').count() > 0;
    console.log(`   Training drawer element: ${drawerExists ? '✅ Exists' : '❌ Missing'}`);
    
    // Test manage training types modal
    if (manageTypesBtn) {
      console.log('\n   Testing Manage Training Types...');
      await page.click('#btn-manage-training-types');
      await page.waitForTimeout(2000);
      
      const modalVisible = await page.locator('#training-types-modal.show').isVisible();
      console.log(`   Modal opens: ${modalVisible ? '✅' : '❌'}`);
      
      if (modalVisible) {
        await page.screenshot({ path: 'training_types_modal.png' });
        const closeBtn = page.locator('#training-types-modal button:has-text("Close")').first();
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
        }
      }
    }
    
    // Test calendar page
    console.log('\n🗓️ Testing calendar page...');
    await page.click('#toggle-scans');
    await page.waitForTimeout(1000);
    await page.click('button[data-section="calendar"]');
    await page.waitForTimeout(2000);
    
    const allClearBadge = await page.locator('text=All clear!').first().isVisible();
    console.log(`   "All clear!" badge: ${allClearBadge ? '✅' : '❌'}`);
    
    console.log('\n✅ UI functionality test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

testUIFunctionality();