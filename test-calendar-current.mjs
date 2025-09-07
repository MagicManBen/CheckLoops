#!/usr/bin/env node
import { chromium } from 'playwright';

const BASE_URL = 'http://127.0.0.1:5500';
const EMAIL = 'ben.howard@stoke.nhs.uk';
const PASSWORD = 'Hello1!';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  
  console.log('📅 Testing current calendar page design...');
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
  
  // Navigate to Calendar
  await page.evaluate(() => {
    document.querySelector('button[data-section="calendar"]')?.click();
  });
  
  await page.waitForTimeout(3000);
  
  console.log('✅ Navigated to Calendar page');

  // Analyze the current calendar styling
  const calendarAnalysis = await page.evaluate(() => {
    const calGrid = document.getElementById('cal-grid');
    const calCells = document.querySelectorAll('.cal-cell');
    const calTasks = document.querySelectorAll('.cal-task');
    const legend = document.querySelector('.cal-legend');
    
    // Get computed styles for key elements
    const gridStyle = calGrid ? window.getComputedStyle(calGrid) : null;
    const firstCell = calCells[0] ? window.getComputedStyle(calCells[0]) : null;
    const firstTask = calTasks[0] ? window.getComputedStyle(calTasks[0]) : null;
    const legendStyle = legend ? window.getComputedStyle(legend) : null;
    
    return {
      gridFound: !!calGrid,
      cellCount: calCells.length,
      taskCount: calTasks.length,
      legendFound: !!legend,
      gridBackground: gridStyle ? gridStyle.background : null,
      cellBackground: firstCell ? firstCell.background : null,
      cellBorder: firstCell ? firstCell.border : null,
      taskColor: firstTask ? firstTask.color : null,
      taskBackground: firstTask ? firstTask.background : null,
      legendColor: legendStyle ? legendStyle.color : null
    };
  });
  
  console.log('📊 Current calendar analysis:');
  console.log('Grid found:', calendarAnalysis.gridFound);
  console.log('Cell count:', calendarAnalysis.cellCount);
  console.log('Task count:', calendarAnalysis.taskCount);
  console.log('Legend found:', calendarAnalysis.legendFound);
  console.log('Cell background:', calendarAnalysis.cellBackground);
  console.log('Task color:', calendarAnalysis.taskColor);
  console.log('Task background:', calendarAnalysis.taskBackground);
  
  // Take screenshot of current state
  await page.screenshot({ path: 'calendar-current-state.png', fullPage: true });
  console.log('📸 Screenshot saved as calendar-current-state.png');
  
  // Check if there are actually any calendar items visible
  const itemVisibility = await page.evaluate(() => {
    const tasks = document.querySelectorAll('.cal-task');
    let visibleCount = 0;
    let lowContrastCount = 0;
    
    tasks.forEach(task => {
      const style = window.getComputedStyle(task);
      const color = style.color;
      const background = style.backgroundColor;
      
      // Simple visibility check
      if (style.display !== 'none' && style.visibility !== 'hidden') {
        visibleCount++;
        
        // Basic contrast check (very simplified)
        if (color.includes('rgba') && color.includes('0.') || 
            background.includes('rgba') && background.includes('0.')) {
          lowContrastCount++;
        }
      }
    });
    
    return {
      totalTasks: tasks.length,
      visibleTasks: visibleCount,
      lowContrastTasks: lowContrastCount
    };
  });
  
  console.log('👁️  Visibility analysis:');
  console.log('Total tasks:', itemVisibility.totalTasks);
  console.log('Visible tasks:', itemVisibility.visibleTasks);
  console.log('Low contrast tasks:', itemVisibility.lowContrastTasks);
  
  if (itemVisibility.lowContrastTasks > 0) {
    console.log('❌ Calendar items have visibility issues (low contrast)');
  } else {
    console.log('✅ Calendar items appear to have good visibility');
  }
  
  await page.waitForTimeout(8000);
  await browser.close();
}

run().catch(console.error);