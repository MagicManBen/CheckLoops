#!/usr/bin/env node
import { chromium } from 'playwright';

const BASE_URL = 'http://127.0.0.1:5500';
const EMAIL = 'ben.howard@stoke.nhs.uk';
const PASSWORD = 'Hello1!';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  
  console.log('🎯 Testing training tracker in Checks & Audits menu...');
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
  
  // Check if training tracker exists in menu
  const menuAnalysis = await page.evaluate(() => {
    // Find the Checks & Audits toggle
    const toggle = document.getElementById('toggle-checks');
    const group = document.getElementById('group-checks');
    const trainingBtn = group?.querySelector('button[data-section="training"]');
    
    return {
      toggleExists: !!toggle,
      groupExists: !!group,
      trainingButtonExists: !!trainingBtn,
      trainingButtonText: trainingBtn?.textContent?.trim(),
      groupCollapsed: group?.classList.contains('collapsed')
    };
  });
  
  console.log('📊 Menu analysis:');
  console.log('Toggle exists:', menuAnalysis.toggleExists);
  console.log('Group exists:', menuAnalysis.groupExists);  
  console.log('Training button exists:', menuAnalysis.trainingButtonExists);
  console.log('Training button text:', menuAnalysis.trainingButtonText);
  console.log('Group collapsed:', menuAnalysis.groupCollapsed);

  if (menuAnalysis.trainingButtonExists) {
    console.log('✅ Training tracker found in Checks & Audits menu');
    
    // Expand the Checks & Audits section if collapsed
    if (menuAnalysis.groupCollapsed) {
      console.log('📂 Expanding Checks & Audits section...');
      await page.click('#toggle-checks');
      await page.waitForTimeout(500);
    }
    
    // Click on Training Tracker
    console.log('🖱️  Clicking on Training Tracker...');
    await page.evaluate(() => {
      document.querySelector('button[data-section="training"]')?.click();
    });
    
    await page.waitForTimeout(3000);
    
    // Check if training view is displayed
    const trainingViewCheck = await page.evaluate(() => {
      const trainingView = document.getElementById('view-training');
      const isVisible = trainingView && trainingView.style.display !== 'none';
      const hasActiveClass = document.querySelector('button[data-section="training"]')?.classList.contains('active');
      const title = trainingView?.querySelector('.page-title')?.textContent;
      
      return {
        trainingViewExists: !!trainingView,
        trainingViewVisible: isVisible,
        buttonActive: hasActiveClass,
        pageTitle: title
      };
    });
    
    console.log('📊 Training view analysis:');
    console.log('Training view exists:', trainingViewCheck.trainingViewExists);
    console.log('Training view visible:', trainingViewCheck.trainingViewVisible);
    console.log('Button active:', trainingViewCheck.buttonActive);
    console.log('Page title:', trainingViewCheck.pageTitle);
    
    if (trainingViewCheck.trainingViewVisible) {
      console.log('✅ Training tracker page loads correctly');
    } else {
      console.log('❌ Training tracker page failed to load');
    }
  } else {
    console.log('❌ Training tracker not found in menu');
  }
  
  // Take screenshot
  await page.screenshot({ path: 'training-menu-test.png', fullPage: true });
  console.log('📸 Screenshot saved as training-menu-test.png');
  
  await page.waitForTimeout(5000);
  await browser.close();
}

run().catch(console.error);