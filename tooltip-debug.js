/**
 * Debugging utilities for the tooltips implementation
 * This can be used in the browser console to diagnose and fix tooltip issues
 */

// Function to test whether event listeners are attached to hearts
function testHeartEvents() {
  const hearts = document.querySelectorAll('.activity-heart');
  console.log(`Found ${hearts.length} hearts in the document`);
  
  hearts.forEach((heart, index) => {
    console.log(`Heart ${index + 1}:`);
    console.log(`- Has onmouseenter: ${heart.hasAttribute('onmouseenter')}`);
    console.log(`- Has onmouseleave: ${heart.hasAttribute('onmouseleave')}`);
    console.log(`- Has tooltip child: ${heart.querySelector('.heart-popup') !== null}`);
  });
}

// Function to manually show tooltips (useful to check if they render correctly)
function showAllTooltips() {
  const tooltips = document.querySelectorAll('.heart-popup');
  console.log(`Found ${tooltips.length} tooltips in the document`);
  
  tooltips.forEach(tooltip => {
    tooltip.style.display = 'block';
  });
  
  return `Showing ${tooltips.length} tooltips`;
}

// Function to hide all tooltips
function hideAllTooltips() {
  const tooltips = document.querySelectorAll('.heart-popup');
  tooltips.forEach(tooltip => {
    tooltip.style.display = 'none';
  });
  
  return `Hidden ${tooltips.length} tooltips`;
}

// Function to manually toggle a specific tooltip
function toggleTooltip(index) {
  const hearts = document.querySelectorAll('.activity-heart');
  
  if (index < 0 || index >= hearts.length) {
    return `Invalid index: ${index}. There are ${hearts.length} hearts.`;
  }
  
  const heart = hearts[index];
  const tooltip = heart.querySelector('.heart-popup');
  
  if (!tooltip) {
    return `Heart ${index} does not have a tooltip.`;
  }
  
  const currentDisplay = tooltip.style.display;
  tooltip.style.display = currentDisplay === 'block' ? 'none' : 'block';
  
  return `Toggled tooltip for heart ${index} to ${tooltip.style.display}`;
}

// Function to check what activity IDs the hearts are attached to
function checkHeartActivities() {
  const hearts = document.querySelectorAll('.activity-heart');
  const results = [];
  
  hearts.forEach((heart, index) => {
    const card = heart.closest('.activity-item');
    if (card) {
      let type = null;
      for (const cls of card.classList) {
        if (['quiz', 'training', 'holiday', 'profile_update', 'new_member'].includes(cls)) {
          type = cls;
          break;
        }
      }
      
      if (!type) {
        type = card.getAttribute('data-activity-type');
      }
      
      const id = card.getAttribute('data-activity-id');
      
      results.push({
        index,
        type,
        id,
        key: type && id ? `${type}:${id}` : 'unknown'
      });
    } else {
      results.push({
        index,
        error: 'Not attached to activity card'
      });
    }
  });
  
  console.table(results);
  return `Checked ${hearts.length} hearts`;
}

// Function to manually apply simple tooltips
async function applyTooltipsManually() {
  if (typeof applySimpleTooltips === 'function') {
    const count = await applySimpleTooltips();
    return `Applied ${count} tooltips with simple tooltips implementation`;
  } else {
    console.error('Simple tooltips implementation not found. Make sure activity-simple-tooltips.js is loaded.');
    return 'Error: Simple tooltips implementation not found';
  }
}

// Function to check all style sheets for tooltip styles
function checkTooltipStyles() {
  const styleSheets = document.styleSheets;
  let found = false;
  
  for (let i = 0; i < styleSheets.length; i++) {
    try {
      const rules = styleSheets[i].cssRules || styleSheets[i].rules;
      if (!rules) continue;
      
      for (let j = 0; j < rules.length; j++) {
        const rule = rules[j];
        if (rule.selectorText && 
           (rule.selectorText.includes('.heart-popup') || 
            rule.selectorText.includes('.activity-heart'))) {
          console.log('Found tooltip style in:', styleSheets[i].href || 'Inline style');
          console.log('Rule:', rule.selectorText);
          console.log('Style:', rule.style.cssText);
          found = true;
        }
      }
    } catch (e) {
      // CORS error when accessing cross-origin style sheets
      console.log('Could not access style rules for:', styleSheets[i].href);
    }
  }
  
  if (!found) {
    console.log('No tooltip styles found in style sheets');
  }
  
  // Check for inline style tag
  const inlineStyle = document.getElementById('simple-tooltip-styles');
  if (inlineStyle) {
    console.log('Found inline tooltip styles with ID: simple-tooltip-styles');
    return 'Tooltip styles found';
  } else {
    return 'No tooltip styles found with ID: simple-tooltip-styles';
  }
}

// Function to check if Supabase client is available
async function checkSupabase() {
  if (!window.supabase) {
    return 'Supabase client not found in window object';
  }
  
  try {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session || !session.user) {
      return 'Supabase session or user not found';
    }
    
    return `Supabase client found and user authenticated: ${session.user.id}`;
  } catch (e) {
    return `Error checking Supabase: ${e.message}`;
  }
}

// Function to manually apply all heart tooltips from scratch
async function applyHeartTooltipsFromScratch() {
  try {
    // Add necessary styles
    const style = document.createElement('style');
    style.id = 'simple-tooltip-styles-manual';
    style.textContent = `
      .heart-popup {
        display: none;
        position: absolute;
        top: -5px;
        right: 25px;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.15);
        padding: 10px;
        min-width: 150px;
        max-width: 250px;
        z-index: 1000;
      }
      
      .heart-popup::after {
        content: '';
        position: absolute;
        right: -10px;
        top: 12px;
        border-width: 5px 0 5px 10px;
        border-style: solid;
        border-color: transparent transparent transparent white;
        filter: drop-shadow(1px 0 0px rgba(0,0,0,0.1));
      }
      
      .heart-popup-title {
        font-weight: bold;
        margin-bottom: 8px;
        font-size: 12px;
        color: #4b5563;
      }
      
      .heart-popup-user {
        display: flex;
        align-items: center;
        margin-bottom: 5px;
        gap: 8px;
      }
      
      .heart-popup-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background-color: #0b4fb3;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
        overflow: hidden;
      }
      
      .heart-popup-name {
        font-size: 12px;
        color: #1e293b;
      }
    `;
    
    document.head.appendChild(style);
    
    // Get Supabase data
    if (!window.supabase) {
      return 'Supabase client not found';
    }
    
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session || !session.user) {
      return 'User not authenticated';
    }
    
    const { data: userData } = await window.supabase
      .from('master_users')
      .select('site_id')
      .eq('auth_user_id', session.user.id)
      .single();
    
    if (!userData || !userData.site_id) {
      return 'Could not determine site ID for user';
    }
    
    const { data: likes, error } = await window.supabase
      .from('activity_likes')
      .select(`
        id, 
        user_id, 
        activity_type, 
        activity_id,
        master_users (
          nickname, 
          full_name,
          avatar_url
        )
      `)
      .eq('site_id', userData.site_id);
    
    if (error) {
      return `Error fetching activity likes: ${error.message}`;
    }
    
    // Group likes by activity
    const likesByActivity = {};
    
    likes.forEach(like => {
      const key = `${like.activity_type}:${like.activity_id}`;
      if (!likesByActivity[key]) {
        likesByActivity[key] = [];
      }
      
      if (like.master_users) {
        likesByActivity[key].push({
          id: like.id,
          userId: like.user_id,
          name: like.master_users.nickname || like.master_users.full_name || 'Anonymous',
          avatar: like.master_users.avatar_url
        });
      }
    });
    
    // Apply tooltips to hearts
    const hearts = document.querySelectorAll('.activity-heart');
    let count = 0;
    
    hearts.forEach((heart, index) => {
      // Remove any existing tooltip
      const existingTooltip = heart.querySelector('.heart-popup');
      if (existingTooltip) {
        existingTooltip.remove();
      }
      
      // Get activity identifiers
      const card = heart.closest('.activity-item');
      if (!card) return;
      
      let type = null;
      for (const cls of card.classList) {
        if (['quiz', 'training', 'holiday', 'profile_update', 'new_member'].includes(cls)) {
          type = cls;
          break;
        }
      }
      
      if (!type) {
        type = card.getAttribute('data-activity-type');
      }
      
      const id = card.getAttribute('data-activity-id');
      if (!type || !id) return;
      
      const key = `${type}:${id}`;
      const activityLikes = likesByActivity[key];
      
      if (!activityLikes || activityLikes.length === 0) return;
      
      // Create tooltip HTML
      const tooltip = document.createElement('div');
      tooltip.className = 'heart-popup';
      tooltip.id = `heart-tooltip-${index}`;
      
      let tooltipContent = `
        <div class="heart-popup-title">
          ${activityLikes.length === 1 ? '1 person liked this' : `${activityLikes.length} people liked this`}
        </div>
      `;
      
      activityLikes.forEach(user => {
        let avatarContent = '';
        
        if (user.avatar) {
          avatarContent = `<img src="${user.avatar}" alt="" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
          avatarContent = user.name.charAt(0).toUpperCase();
        }
        
        tooltipContent += `
          <div class="heart-popup-user">
            <div class="heart-popup-avatar">${avatarContent}</div>
            <div class="heart-popup-name">${user.name}</div>
          </div>
        `;
      });
      
      tooltip.innerHTML = tooltipContent;
      
      // Add tooltip to heart
      heart.appendChild(tooltip);
      
      // Add direct event handlers
      heart.onmouseenter = function() {
        tooltip.style.display = 'block';
      };
      
      heart.onmouseleave = function() {
        tooltip.style.display = 'none';
      };
      
      count++;
    });
    
    return `Applied ${count} tooltips from scratch`;
  } catch (e) {
    return `Error applying tooltips: ${e.message}`;
  }
}

console.log('Heart tooltips debugging utilities loaded');
console.log('Available commands:');
console.log('- testHeartEvents() - Test if event handlers are attached to hearts');
console.log('- showAllTooltips() - Show all tooltips');
console.log('- hideAllTooltips() - Hide all tooltips');
console.log('- toggleTooltip(index) - Toggle tooltip for a specific heart');
console.log('- checkHeartActivities() - Check what activities hearts are attached to');
console.log('- applyTooltipsManually() - Apply tooltips manually');
console.log('- checkTooltipStyles() - Check for tooltip styles in stylesheets');
console.log('- checkSupabase() - Check Supabase connection');
console.log('- applyHeartTooltipsFromScratch() - Complete tooltip application from scratch');