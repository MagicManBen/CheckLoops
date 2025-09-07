#!/usr/bin/env node
import { chromium } from 'playwright';

const BASE_URL = 'http://127.0.0.1:5500';
const EMAIL = 'ben.howard@stoke.nhs.uk';
const PASSWORD = 'Hello1!';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  
  console.log('🎯 Testing progress bar gradient colors...');
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

  // Test progress bar gradient at different percentages
  const progressAnalysis = await page.evaluate(() => {
    const progressBar = document.getElementById('pir-progress-bar');
    if (!progressBar) return { error: 'Progress bar not found' };
    
    // Get the getProgressGradient function and test it
    const results = [];
    const testPercentages = [0, 25, 50, 75, 100];
    
    testPercentages.forEach(percentage => {
      // Simulate setting the progress
      progressBar.style.width = percentage + '%';
      
      // Call the gradient function (available in global scope)
      const gradient = window.getProgressGradient ? window.getProgressGradient(percentage) : 'Function not found';
      
      // Apply the gradient
      if (window.getProgressGradient) {
        progressBar.style.background = gradient;
      }
      
      // Get computed style
      const computedStyle = window.getComputedStyle(progressBar);
      
      results.push({
        percentage,
        gradient,
        computedBackground: computedStyle.background,
        width: computedStyle.width
      });
    });
    
    return results;
  });
  
  console.log('📊 Progress bar gradient analysis:');
  progressAnalysis.forEach(result => {
    console.log(`${result.percentage}%: ${result.gradient}`);
    console.log(`  Applied: ${result.computedBackground}`);
    console.log(`  Width: ${result.width}`);
    console.log('');
  });
  
  // Take screenshot
  await page.screenshot({ path: 'progress-bar-gradient.png', fullPage: true });
  console.log('📸 Screenshot saved as progress-bar-gradient.png');
  
  console.log('✅ Progress bar gradient test completed');
  
  await page.waitForTimeout(5000);
  await browser.close();
}

run().catch(console.error);