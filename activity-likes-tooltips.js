/**
 * Enhancement for activity likes to display user tooltips on heart hover
 * Shows avatar and nickname of users who liked an activity
 */

// Function to create and update heart tooltips
async function enhanceActivityLikesTooltips() {
  console.log('Enhancing activity likes with user tooltips...');
  
  try {
    const { data: { session } } = await window.supabase.auth.getSession();
    
    if (!session || !session.user) {
      console.error('User not authenticated');
      return false;
    }
    
    const { data: userData } = await window.supabase
      .from('master_users')
      .select('site_id')
      .eq('auth_user_id', session.user.id)
      .single();
      
    if (!userData || !userData.site_id) {
      console.error('Could not determine site ID for user');
      return false;
    }
    
    // Fetch ALL likes with user information for this site
    const { data: allLikesWithUsers, error } = await window.supabase
      .from('activity_likes')
      .select(`
        id, 
        user_id, 
        activity_type, 
        activity_id,
        master_users!activity_likes_user_id_fkey(
          nickname, 
          full_name,
          avatar_url
        )
      `)
      .eq('site_id', userData.site_id);
      
    if (error) {
      console.error('Error fetching likes with user information:', error);
      return false;
    }
    
    if (!allLikesWithUsers || allLikesWithUsers.length === 0) {
      console.log('No activity likes found for this site');
      return false;
    }
    
    console.log(`Found ${allLikesWithUsers.length} likes to enhance with user info`);
    
    // Group likes by activity
    const likesByActivity = {};
    
    allLikesWithUsers.forEach(like => {
      const likeKey = `${like.activity_type}:${like.activity_id}`;
      
      if (!likesByActivity[likeKey]) {
        likesByActivity[likeKey] = [];
      }
      
      // Extract user info from the join
      if (like.master_users) {
        likesByActivity[likeKey].push({
          userId: like.user_id,
          nickname: like.master_users.nickname || like.master_users.full_name || 'Anonymous',
          avatarUrl: like.master_users.avatar_url
        });
      }
    });
    
    // Find all heart elements and add tooltips
    const heartElements = document.querySelectorAll('.activity-heart');
    let enhancedCount = 0;
    
    heartElements.forEach(heart => {
      const activityCard = heart.closest('.activity-item');
      if (!activityCard) return;
      
      const activityType = getActivityTypeFromCard(activityCard);
      const activityId = getActivityIdFromCard(activityCard);
      
      if (!activityType || !activityId) return;
      
      const likeKey = `${activityType}:${activityId}`;
      const likesForActivity = likesByActivity[likeKey];
      
      if (likesForActivity && likesForActivity.length > 0) {
        // Remove any existing tooltip and event listeners
        const existingTooltip = heart.querySelector('.heart-tooltip');
        if (existingTooltip) {
          existingTooltip.remove();
        }
        
        // Remove old event listeners if they exist
        if (heart._mouseoverHandler) {
          heart.removeEventListener('mouseover', heart._mouseoverHandler);
        }
        if (heart._mouseoutHandler) {
          heart.removeEventListener('mouseout', heart._mouseoutHandler);
        }
        
        // Create tooltip content
        const tooltipContent = createHeartTooltip(likesForActivity);
        
        // Add tooltip to heart
        heart.appendChild(tooltipContent);
        
        // Add direct event listeners for tooltip visibility
        heart.classList.add('tooltip-enabled');
        heart.style.cursor = 'pointer';
        
        // Store the tooltip for easy access
        heart._tooltip = tooltipContent;
        
        // Add direct mouseover/mouseout handlers
        heart._mouseoverHandler = function() {
          if (heart._tooltip) {
            heart._tooltip.style.display = 'block';
          }
        };
        
        heart._mouseoutHandler = function() {
          if (heart._tooltip) {
            heart._tooltip.style.display = 'none';
          }
        };
        
        // Add event listeners
        heart.addEventListener('mouseover', heart._mouseoverHandler);
        heart.addEventListener('mouseout', heart._mouseoutHandler);
        
        // Add title attribute for basic tooltip fallback
        heart.setAttribute('title', `${likesForActivity.length} ${likesForActivity.length === 1 ? 'person' : 'people'} liked this`);
        
        enhancedCount++;
      }
    });
    
    console.log(`Enhanced ${enhancedCount} heart elements with user tooltips`);
    return true;
  } catch (err) {
    console.error('Error enhancing activity likes tooltips:', err);
    return false;
  }
}

// Helper function to extract activity type from card
function getActivityTypeFromCard(card) {
  // Try to extract from the element's classList first
  for (const className of card.classList) {
    if (['quiz', 'training', 'holiday', 'profile_update', 'new_member'].includes(className)) {
      return className;
    }
  }
  
  // Fallback to data attribute
  return card.getAttribute('data-activity-type');
}

// Helper function to extract activity ID from card
function getActivityIdFromCard(card) {
  return card.getAttribute('data-activity-id');
}

// Function to create tooltip element with user info
function createHeartTooltip(usersWhoLiked) {
  const tooltipEl = document.createElement('div');
  tooltipEl.className = 'heart-tooltip';
  
  // Apply styling to the tooltip
  tooltipEl.style.cssText = `
    position: absolute;
    right: 25px;
    top: 0;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.15);
    padding: 8px;
    width: max-content;
    max-width: 220px;
    display: none;
    z-index: 100;
    border: 1px solid #e2e8f0;
    pointer-events: auto;
  `;
  
  // Add heading
  const heading = document.createElement('div');
  heading.style.cssText = `
    font-weight: 600;
    font-size: 12px;
    margin-bottom: 6px;
    color: #475569;
  `;
  heading.textContent = usersWhoLiked.length === 1 
    ? '1 person liked this' 
    : `${usersWhoLiked.length} people liked this`;
  tooltipEl.appendChild(heading);
  
  // Add user list
  const userList = document.createElement('div');
  userList.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 150px;
    overflow-y: auto;
  `;
  
  // Add each user
  usersWhoLiked.forEach(user => {
    const userItem = document.createElement('div');
    userItem.style.cssText = `
      display: flex;
      align-items: center;
      gap: 6px;
    `;
    
    // Create avatar
    const avatar = document.createElement('div');
    avatar.style.cssText = `
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #0b4fb3;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 10px;
      font-weight: bold;
      overflow: hidden;
    `;
    
    if (user.avatarUrl) {
      avatar.innerHTML = `<img src="${user.avatarUrl}" alt="" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
      // Use first letter of nickname as fallback
      const initial = user.nickname.charAt(0).toUpperCase();
      avatar.textContent = initial;
    }
    
    // Create name label
    const nameLabel = document.createElement('div');
    nameLabel.style.cssText = `
      font-size: 12px;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    nameLabel.textContent = user.nickname;
    
    userItem.appendChild(avatar);
    userItem.appendChild(nameLabel);
    userList.appendChild(userItem);
  });
  
  tooltipEl.appendChild(userList);
  
  return tooltipEl;
}

// Add CSS to document head for heart hover effects
function addHeartTooltipStyles() {
  const styleId = 'heart-tooltip-styles';
  
  // Don't add styles if they already exist
  if (document.getElementById(styleId)) {
    return;
  }
  
  const styleEl = document.createElement('style');
  styleEl.id = styleId;
  styleEl.textContent = `
    .activity-heart.tooltip-enabled {
      cursor: pointer !important;
      position: relative;
    }
    
    /* We'll handle this with JS instead */
    /*
    .activity-heart.tooltip-enabled:hover .heart-tooltip {
      display: block;
    }
    */
    
    .heart-tooltip::-webkit-scrollbar {
      width: 6px;
    }
    
    .heart-tooltip::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }
    
    .heart-tooltip::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
    
    .heart-tooltip::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
    
    /* Add a tooltip arrow */
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
      filter: drop-shadow(1px 0 1px rgba(0,0,0,0.1));
    }
  `;
  
  document.head.appendChild(styleEl);
}

// Run the enhancement when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Add tooltip styles
  addHeartTooltipStyles();
  
  // Wait a bit for the activity likes to be initialized and fixed first
  setTimeout(() => {
    enhanceActivityLikesTooltips().then(result => {
      console.log('Activity likes tooltips enhancement applied:', result);
    });
  }, 2000); // Wait 2 seconds to ensure the main scripts have run
});

// Re-apply enhancements when activity feed is updated
const activityFeed = document.getElementById('activity-feed');
if (activityFeed) {
  // Use a MutationObserver to detect when activity feed content changes
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Activity feed was updated, apply enhancements again after a short delay
        setTimeout(() => {
          enhanceActivityLikesTooltips().then(result => {
            console.log('Activity likes tooltips re-applied after feed update:', result);
          });
        }, 1000);
        break;
      }
    }
  });
  
  // Start observing
  observer.observe(activityFeed, { childList: true });
}