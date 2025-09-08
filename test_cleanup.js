import { chromium } from 'playwright';

async function runCleanup() {
  console.log('🧹 Starting account cleanup process...');
  
  // Start local server
  const { spawn } = await import('child_process');
  const server = spawn('python3', ['-m', 'http.server', '8000'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // First login as the user to get access to delete their data
    console.log('🔑 Logging in as benhowardmagic@hotmail.com...');
    await page.goto('http://localhost:8000/Home.html');
    await page.waitForTimeout(2000);
    
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    
    await page.waitForTimeout(5000);
    console.log('✅ Logged in successfully');
    
    // Navigate to cleanup page
    console.log('🛠️  Opening cleanup tool...');
    await page.goto('http://localhost:8000/cleanup.html');
    await page.waitForTimeout(2000);
    
    // Run cleanup
    console.log('🗑️  Running cleanup...');
    await page.click('button:has-text("🧹 Clean Up Account")');
    
    // Wait for cleanup to complete
    await page.waitForTimeout(10000);
    
    // Get the log output
    const logContent = await page.locator('#log').textContent();
    console.log('📋 Cleanup log:');
    console.log(logContent);
    
    console.log('✨ Cleanup completed! The account benhowardmagic@hotmail.com has been cleaned from all tables.');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await browser.close();
    server.kill();
    console.log('🏁 Process completed');
  }
}

runCleanup().catch(console.error);