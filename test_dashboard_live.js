import { chromium } from 'playwright';

async function testLiveDashboard() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console messages for debugging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (text.includes('Loading') || text.includes('compliance') || text.includes('Dashboard') || text.includes('PIR') || text.includes('Training') || text.includes('Complaints')) {
      console.log(`[${type.toUpperCase()}] ${text}`);
    }
  });

  try {
    console.log('🔍 Testing live dashboard with real Supabase data...');
    
    // Navigate and login
    await page.goto('http://127.0.0.1:5500/index.html');
    await page.waitForTimeout(3000);
    
    if (page.url().includes('Home.html')) {
      console.log('🔑 Logging in...');
      await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
      await page.locator('#password').fill('Hello1!');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(6000);
    }
    
    console.log('📊 Testing dashboard metrics...');
    await page.waitForTimeout(3000);
    
    // Get dashboard metrics to verify they're no longer hardcoded
    const dashboardData = await page.evaluate(() => {
      const overallScore = document.getElementById('score-number')?.textContent;
      const pirMetric = document.getElementById('pir-metric')?.textContent;
      const trainingMetric = document.getElementById('training-metric')?.textContent;
      const safetyMetric = document.getElementById('safety-metric')?.textContent;
      const complaintsMetric = document.getElementById('complaints-metric')?.textContent;
      
      return {
        overallScore,
        pirMetric,
        trainingMetric,
        safetyMetric,
        complaintsMetric
      };
    });
    
    console.log('\n📊 Current Dashboard Metrics:');
    console.log(JSON.stringify(dashboardData, null, 2));
    
    // Test that the dashboard loading functions work
    const testResults = await page.evaluate(async () => {
      if (!window.supabase || !window.ctx) {
        return { error: 'Supabase or context not available' };
      }
      
      try {
        console.log('Testing loadPIRCompliance...');
        const pirData = await loadPIRCompliance();
        console.log('PIR Data:', pirData);
        
        console.log('Testing loadTrainingCompliance...');  
        const trainingData = await loadTrainingCompliance();
        console.log('Training Data:', trainingData);
        
        console.log('Testing loadComplaintsCompliance...');
        const complaintsData = await loadComplaintsCompliance();
        console.log('Complaints Data:', complaintsData);
        
        // Test updatePIRSection function  
        console.log('Testing updatePIRSection...');
        updatePIRSection(pirData);
        
        console.log('Testing updateTrainingSection...');
        updateTrainingSection(trainingData);
        
        console.log('Testing updateComplaintsSection...');
        updateComplaintsSection(complaintsData);
        
        // Calculate overall readiness
        const overallScore = calculateOverallReadiness(pirData, trainingData, trainingData, complaintsData);
        console.log('Overall Score:', overallScore);
        updateOverallReadiness(overallScore);
        
        return {
          pir: pirData,
          training: trainingData, 
          complaints: complaintsData,
          overallScore: overallScore,
          success: true
        };
      } catch (e) {
        return { error: e.message, stack: e.stack };
      }
    });
    
    console.log('\n📋 Dashboard Function Test Results:');
    console.log(JSON.stringify(testResults, null, 2));
    
    // Get final dashboard values after running functions
    await page.waitForTimeout(2000);
    const finalData = await page.evaluate(() => {
      const overallScore = document.getElementById('score-number')?.textContent;
      const pirMetric = document.getElementById('pir-metric')?.textContent;
      const trainingMetric = document.getElementById('training-metric')?.textContent;
      const safetyMetric = document.getElementById('safety-metric')?.textContent;
      const complaintsMetric = document.getElementById('complaints-metric')?.textContent;
      
      return {
        overallScore,
        pirMetric,
        trainingMetric,
        safetyMetric,
        complaintsMetric
      };
    });
    
    console.log('\n📊 Final Dashboard Metrics (after updates):');
    console.log(JSON.stringify(finalData, null, 2));
    
    // Take screenshot for verification
    await page.screenshot({ path: 'dashboard-live-test.png', fullPage: true });
    console.log('📸 Screenshot saved as dashboard-live-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🔍 Test completed. Browser will close in 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
}

testLiveDashboard();