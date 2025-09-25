/**
 * Simple tooltip implementation for activity likes
 * This is a more direct approach that should work reliably
 */

// Add necessary styles for tooltips
function addTooltipStyles() {
  if (document.getElementById('simple-tooltip-styles')) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = 'simple-tooltip-styles';
  style.textContent = `
    .activity-heart {
      position: absolute !important;
      top: 8px !important;
      right: 8px !important;
      font-size: 18px !important;
      animation: pulse 1.5s infinite !important;
      cursor: pointer !important;
      z-index: 2 !important;
    }
    
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
  console.log('Simple tooltip styles added');
}

// Function to query Supabase for likes
async function fetchActivityLikes() {
  try {
    if (!window.supabase) {
      console.error('Supabase client not available');
      return null;
    }
    
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session || !session.user) {
      console.error('User not authenticated');
      return null;
    }
    
    const { data: userData } = await window.supabase
      .from('master_users')
      .select('site_id')
      .eq('auth_user_id', session.user.id)
      .single();
    
    if (!userData || !userData.site_id) {
      console.error('Could not determine site ID for user');
      return null;
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
      console.error('Error fetching activity likes:', error);
      return null;
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
    
    return likesByActivity;
  } catch (err) {
    console.error('Error fetching activity likes:', err);
    return null;
  }
}

// Get activity type and ID from an activity card
function getActivityIdentifiers(card) {
  // Try to get activity type from classes first
  let type = null;
  for (const cls of card.classList) {
    if (['quiz', 'training', 'holiday', 'profile_update', 'new_member'].includes(cls)) {
      type = cls;
      break;
    }
  }
  
  // Fallback to data attribute
  if (!type) {
    type = card.getAttribute('data-activity-type');
  }
  
  // Get the ID
  const id = card.getAttribute('data-activity-id');
  
  return { type, id };
}

// Create and attach tooltips to hearts
function createAndAttachTooltips(hearts, likesByActivity) {
  let count = 0;
  
  hearts.forEach(heart => {
    const card = heart.closest('.activity-item');
    if (!card) return;
    
    const { type, id } = getActivityIdentifiers(card);
    if (!type || !id) return;
    
    const key = `${type}:${id}`;
    const likes = likesByActivity[key];
    
    if (!likes || likes.length === 0) return;
    
    // Create tooltip HTML
    const tooltip = document.createElement('div');
    tooltip.className = 'heart-popup';
    
    let tooltipContent = `
      <div class="heart-popup-title">
        ${likes.length === 1 ? '1 person liked this' : `${likes.length} people liked this`}
      </div>
    `;
    
    likes.forEach(user => {
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
    
    // Remove any existing event listeners
    heart.removeAttribute('onmouseover');
    heart.removeAttribute('onmouseout');
    heart.removeAttribute('onmouseenter');
    heart.removeAttribute('onmouseleave');
    
    // Add inline event handlers
    heart.setAttribute('onmouseenter', "this.querySelector('.heart-popup').style.display = 'block';");
    heart.setAttribute('onmouseleave', "this.querySelector('.heart-popup').style.display = 'none';");
    
    count++;
  });
  
  return count;
}

// Main function to apply tooltips
async function applySimpleTooltips() {
  console.log('Applying simple tooltips to hearts...');
  
  // Add tooltip styles
  addTooltipStyles();
  
  // Get all heart elements
  const hearts = document.querySelectorAll('.activity-heart');
  console.log(`Found ${hearts.length} hearts`);
  
  if (hearts.length === 0) {
    console.log('No hearts found - nothing to enhance');
    return 0;
  }
  
  // Fetch likes from Supabase
  const likesByActivity = await fetchActivityLikes();
  
  if (!likesByActivity) {
    console.error('Could not fetch activity likes');
    return 0;
  }
  
  // Create and attach tooltips
  const count = createAndAttachTooltips(hearts, likesByActivity);
  console.log(`Enhanced ${count} hearts with tooltips`);
  
  return count;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Wait for activity likes to be loaded first
  setTimeout(() => {
    applySimpleTooltips().then(count => {
      console.log(`Simple tooltips initialization complete: ${count} tooltips added`);
    });
  }, 2000);
});

// Re-apply when activity feed updates
const activityFeed = document.getElementById('activity-feed');
if (activityFeed) {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        setTimeout(() => {
          applySimpleTooltips().then(count => {
            console.log(`Simple tooltips re-applied after feed update: ${count} tooltips added`);
          });
        }, 1000);
        break;
      }
    }
  });
  
  observer.observe(activityFeed, { childList: true });
}