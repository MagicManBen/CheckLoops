/**
 * Debug script to manually show activity likes
 * Run in browser console: loadDebugScript('/test-tooltips.js')
 */

// This function loads a script dynamically into the page
function loadDebugScript(url) {
  console.log(`Loading debug script: ${url}`);
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => {
      console.log(`Debug script loaded: ${url}`);
      resolve();
    };
    script.onerror = (err) => {
      console.error(`Failed to load debug script: ${url}`, err);
      reject(err);
    };
    document.body.appendChild(script);
  });
}

// Manual function to add a heart to all activity cards
function addHeartsToActivities() {
  console.log('Adding hearts to all activities for testing...');
  
  const activities = document.querySelectorAll('.activity-item');
  console.log(`Found ${activities.length} activities`);
  
  let count = 0;
  activities.forEach(activity => {
    // Skip if it already has a heart
    if (activity.querySelector('.activity-heart')) {
      return;
    }
    
    // Create heart element
    const heart = document.createElement('div');
    heart.className = 'activity-heart';
    heart.innerHTML = '❤️';
    heart.style.cssText = 
      'position: absolute; top: 8px; right: 8px; font-size: 18px; ' +
      'animation: pulse 1.5s infinite; cursor: pointer; z-index: 2;';
    
    // Ensure card has position relative for absolute positioning
    if (getComputedStyle(activity).position !== 'relative') {
      activity.style.position = 'relative';
    }
    
    // Add to card
    activity.appendChild(heart);
    count++;
  });
  
  console.log(`Added ${count} hearts to activities`);
  return `Added ${count} hearts`;
}

// Debug function to check if tooltips are working properly
function checkTooltipSystem() {
  const result = {
    hearts: document.querySelectorAll('.activity-heart').length,
    tooltipsEnabled: document.querySelectorAll('.tooltip-enabled').length,
    styleSheet: !!document.getElementById('heart-tooltip-styles'),
    tooltips: document.querySelectorAll('.heart-tooltip').length,
    visibleTooltips: Array.from(document.querySelectorAll('.heart-tooltip')).filter(t => getComputedStyle(t).display !== 'none').length
  };
  
  console.table(result);
  return result;
}

// Function to manually fix tooltips if they're not showing
async function fixTooltips() {
  console.log('Fixing tooltips manually...');
  
  // Make sure styles are added
  const styleId = 'heart-tooltip-styles';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      .activity-heart {
        cursor: pointer !important;
        position: relative;
      }
      
      .heart-tooltip {
        position: absolute;
        right: 25px;
        top: 0;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.15);
        padding: 8px;
        width: max-content;
        max-width: 220px;
        z-index: 100;
        border: 1px solid #e2e8f0;
      }
      
      .heart-tooltip::after {
        content: '';
        position: absolute;
        right: -6px;
        top: 8px;
        width: 0;
        height: 0;
        border-top: 6px solid transparent;
        border-bottom: 6px solid transparent;
        border-left: 6px solid white;
      }
    `;
    document.head.appendChild(styleEl);
  }
  
  // Load test tooltips
  await loadDebugScript('/test-tooltips.js');
  
  console.log('Tooltips should now be fixed');
}

// Utility to check the state of the likes system
function checkLikesSystem() {
  return {
    supabaseAvailable: !!window.supabase,
    activityLikesModule: !!window.ActivityLikes,
    initializeFunction: typeof window.initializeActivityLikes === 'function',
    fixFunction: typeof window.fixActivityLikes === 'function',
    tooltipFunction: typeof window.enhanceActivityLikesTooltips === 'function',
  };
}