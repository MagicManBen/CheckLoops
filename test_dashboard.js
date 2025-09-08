import { chromium } from 'playwright';

async function testDashboard() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (text.includes('Loading') || text.includes('CQC') || text.includes('compliance') || text.includes('Dashboard')) {
      console.log(`[${type.toUpperCase()}] ${text}`);
    }
  });

  try {
    console.log('🔍 Testing current dashboard data...');
    
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
    
    console.log('📊 Checking dashboard metrics...');
    await page.waitForTimeout(3000);
    
    // Get current dashboard values
    const dashboardData = await page.evaluate(() => {
      // Get the displayed values
      const overallScore = document.getElementById('score-number')?.textContent;
      const pirMetric = document.getElementById('pir-metric')?.textContent;
      const complianceMetric = document.getElementById('compliance-metric')?.textContent;
      
      // Check if we can access the data that should be powering these metrics
      const result = {
        displayedValues: {
          overallScore,
          pirMetric,
          complianceMetric
        }
      };
      
      return result;
    });
    
    console.log('\n📊 Current Dashboard Data:');
    console.log(JSON.stringify(dashboardData, null, 2));
    
    // Now test actual queries to see what data is available
    const actualData = await page.evaluate(async () => {
      if (!window.supabase || !window.ctx) {
        return { error: 'Supabase or context not available' };
      }
      
      try {
        // Test PIR documents query
        const { data: pirData, error: pirError } = await supabase
          .from('pir_documents')
          .select('id, status, title')
          .eq('site_id', ctx.site_id);
        
        // Test training records query  
        const { data: trainingData, error: trainingError } = await supabase
          .from('training_records')
          .select('id, staff_id, completion_date, expiry_date')
          .eq('site_id', ctx.site_id);
        
        // Test complaints query
        const { data: complaintsData, error: complaintsError } = await supabase
          .from('complaints')
          .select('id, status, created_at')
          .eq('site_id', ctx.site_id);
        
        // Count statuses
        const pirStats = {};
        (pirData || []).forEach(doc => {
          pirStats[doc.status] = (pirStats[doc.status] || 0) + 1;
        });
        
        const complaintsStats = {};
        (complaintsData || []).forEach(complaint => {
          complaintsStats[complaint.status] = (complaintsStats[complaint.status] || 0) + 1;
        });
        
        return {
          pir: {
            total: pirData?.length || 0,
            statusBreakdown: pirStats,
            error: pirError?.message
          },
          training: {
            total: trainingData?.length || 0,
            error: trainingError?.message
          },
          complaints: {
            total: complaintsData?.length || 0,
            statusBreakdown: complaintsStats,
            error: complaintsError?.message
          },
          context: {
            site_id: ctx.site_id,
            user: ctx.user?.email
          }
        };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    console.log('\n📋 Actual Database Data:');
    console.log(JSON.stringify(actualData, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🔍 Test completed. Browser will close in 15 seconds...');
  await page.waitForTimeout(15000);
  await browser.close();
}

testDashboard();