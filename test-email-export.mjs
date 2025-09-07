#!/usr/bin/env node
import { chromium } from 'playwright';

const BASE_URL = 'http://127.0.0.1:5500';
const EMAIL = 'ben.howard@stoke.nhs.uk';
const PASSWORD = 'Hello1!';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({
    // Allow downloads
    acceptDownloads: true
  });
  const page = await ctx.newPage();
  
  console.log('🎯 Testing email package export functionality...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  // Login
  await page.waitForTimeout(2000);
  const loginForm = await page.locator('#email').count();
  if (loginForm) {
    await page.fill('#email', EMAIL);
    await page.fill('#password', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  }

  console.log('✅ Logged in');
  
  // Navigate to Pre-inspection
  await page.evaluate(() => {
    document.querySelector('button[data-section="pre-inspection"]')?.click();
  });
  
  await page.waitForTimeout(3000);
  console.log('✅ Navigated to Pre-inspection page');

  // Check if the button text has been updated
  const buttonAnalysis = await page.evaluate(() => {
    const exportBtn = document.getElementById('pir-export');
    return {
      exists: !!exportBtn,
      text: exportBtn?.textContent?.trim(),
      visible: exportBtn ? window.getComputedStyle(exportBtn).display !== 'none' : false
    };
  });
  
  console.log('📊 Export button analysis:');
  console.log('Button exists:', buttonAnalysis.exists);
  console.log('Button text:', buttonAnalysis.text);
  console.log('Button visible:', buttonAnalysis.visible);
  
  if (buttonAnalysis.exists && buttonAnalysis.text === 'Generate Email Packages') {
    console.log('✅ Button text updated correctly');
    
    console.log('🖱️  Clicking Generate Email Packages button...');
    
    // Set up download handler
    const downloadPromise = page.waitForEvent('download');
    
    // Click the export button
    await page.click('#pir-export');
    
    try {
      // Wait for download to start
      const download = await Promise.race([
        downloadPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Download timeout')), 10000)
        )
      ]);
      
      console.log('✅ Download started');
      console.log('Download filename:', download.suggestedFilename());
      
      // Check if it's a zip file
      const filename = download.suggestedFilename();
      if (filename.endsWith('.zip') && filename.includes('CQC_Pre_Inspection_Emails')) {
        console.log('✅ Correct zip filename format');
      } else {
        console.log('❌ Unexpected filename format:', filename);
      }
      
    } catch (error) {
      console.log('❌ Download failed or timed out:', error.message);
      
      // Check if there was a notification instead
      const notificationCheck = await page.evaluate(() => {
        const notifications = document.querySelectorAll('.notification, .toast, .alert');
        return Array.from(notifications).map(n => n.textContent?.trim()).filter(Boolean);
      });
      
      if (notificationCheck.length > 0) {
        console.log('📢 Notifications found:', notificationCheck);
      }
    }
    
  } else {
    console.log('❌ Button not found or text not updated correctly');
  }
  
  // Take screenshot
  await page.screenshot({ path: 'email-export-test.png', fullPage: true });
  console.log('📸 Screenshot saved as email-export-test.png');
  
  await page.waitForTimeout(8000);
  await browser.close();
}

run().catch(console.error);