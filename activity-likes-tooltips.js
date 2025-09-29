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
    
    // Fetch ALL likes with user information for this site (fixed join)
    const { data: allLikes, error: likesError } = await window.supabase
      .from('activity_likes')
      .select('*')
      .eq('site_id', userData.site_id);

    if (likesError) {
      console.error('Error fetching likes:', likesError);
      return false;
    }

    // Get user details for all likes
    const userIds = [...new Set(allLikes.map(like => like.user_id))];
    const { data: users, error: usersError } = await window.supabase
      .from('master_users')
      .select('auth_user_id, nickname, full_name, avatar_url')
      .in('auth_user_id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return false;
    }

    // Create a map of user data
    const userMap = {};
    users.forEach(user => {
      userMap[user.auth_user_id] = user;
    });

    // Combine likes with user data
    const allLikesWithUsers = allLikes.map(like => ({
      ...like,
      master_users: userMap[like.user_id] || null
    }));
    
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

    console.log(`Found ${heartElements.length} heart elements to enhance with tooltips`);

    heartElements.forEach(heart => {
      const activityCard = heart.closest('.activity-item');
      if (!activityCard) {
        console.warn('Heart element without parent activity card');
        return;
      }

      const activityType = getActivityTypeFromCard(activityCard);
      const activityId = getActivityIdFromCard(activityCard);

      if (!activityType || !activityId) {
        console.warn(`Could not determine activity type/id for heart: type=${activityType}, id=${activityId}`);
        return;
      }

      const likeKey = `${activityType}:${activityId}`;
      const likesForActivity = likesByActivity[likeKey];
      
      // Even if no likes data yet, set up the click handler to fetch on-demand
      // Remove any existing tooltip and event listeners
      const existingTooltip = heart.querySelector('.heart-tooltip');
      if (existingTooltip) {
        existingTooltip.remove();
      }

      // Remove old event listeners if they exist
      if (heart._clickHandler) {
        heart.removeEventListener('click', heart._clickHandler);
      }

      // Add click handler for all hearts
      heart.classList.add('tooltip-enabled');
      heart.style.cursor = 'pointer';

      if (likesForActivity && likesForActivity.length > 0) {
        // Create tooltip content
        const tooltipContent = createHeartTooltip(likesForActivity);

        // Add tooltip to heart
        heart.appendChild(tooltipContent);

        // Store the tooltip for easy access
        heart._tooltip = tooltipContent;

        // Add title attribute for basic tooltip fallback
        heart.setAttribute('title', `${likesForActivity.length} ${likesForActivity.length === 1 ? 'person' : 'people'} liked this`);
      } else {
        // No likes data, create empty tooltip
        const emptyTooltip = document.createElement('div');
        emptyTooltip.className = 'heart-tooltip';
        emptyTooltip.style.cssText = `
          position: absolute;
          right: 25px;
          top: 0;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.15);
          padding: 8px;
          display: none;
          z-index: 100;
          border: 1px solid #e2e8f0;
        `;
        emptyTooltip.innerHTML = '<div style="font-size: 12px; color: #666;">No likes yet</div>';
        heart.appendChild(emptyTooltip);
        heart._tooltip = emptyTooltip;
      }

      // Add click handler to toggle tooltip for ALL hearts
      heart._clickHandler = async function(e) {
        console.log('Heart clicked!');
        e.stopPropagation();
        e.preventDefault();

        // If no tooltip content, try fetching likes again
        if (!heart._tooltip || heart._tooltip.textContent === 'No likes yet') {
          console.log('No tooltip or empty, fetching fresh data...');

          // Fetch fresh likes data
          const activityCard = heart.closest('.activity-item');
          const activityType = getActivityTypeFromCard(activityCard);
          const activityId = getActivityIdFromCard(activityCard);
          const likeKey = `${activityType}:${activityId}`;

          console.log('Fetching likes for:', { activityType, activityId, likeKey });

          // Try to get fresh likes data
          try {
            const { data: freshLikes } = await window.supabase
              .from('activity_likes')
              .select('*')
              .eq('activity_type', activityType)
              .eq('activity_id', activityId);

            if (freshLikes && freshLikes.length > 0) {
              // Get user details
              const userIds = [...new Set(freshLikes.map(l => l.user_id))];
              const { data: users } = await window.supabase
                .from('master_users')
                .select('auth_user_id, nickname, full_name, avatar_url')
                .in('auth_user_id', userIds);

              const userMap = {};
              if (users) {
                users.forEach(u => {
                  userMap[u.auth_user_id] = u;
                });
              }

              const likesWithUsers = freshLikes.map(like => ({
                userId: like.user_id,
                nickname: userMap[like.user_id]?.nickname || userMap[like.user_id]?.full_name || 'Anonymous',
                avatarUrl: userMap[like.user_id]?.avatar_url
              }));

              // Update tooltip
              if (heart._tooltip) {
                heart._tooltip.remove();
              }
              const newTooltip = createHeartTooltip(likesWithUsers);
              heart.appendChild(newTooltip);
              heart._tooltip = newTooltip;
              heart._tooltip.style.display = 'block';
            }
          } catch (err) {
            console.error('Error fetching fresh likes:', err);
          }
        }

        // Close any other open tooltips
        document.querySelectorAll('.heart-tooltip').forEach(tooltip => {
          if (tooltip !== heart._tooltip) {
            tooltip.style.display = 'none';
          }
        });

        // Toggle this tooltip
        if (heart._tooltip) {
          const isVisible = heart._tooltip.style.display === 'block';
          heart._tooltip.style.display = isVisible ? 'none' : 'block';
          console.log('Tooltip toggled to:', heart._tooltip.style.display);
        } else {
          console.warn('No tooltip to toggle!');
        }
      };

      // Add event listener
      heart.addEventListener('click', heart._clickHandler);

      // Add a document click handler to close tooltips when clicking outside
      if (!document._heartTooltipCloseHandler) {
        document._heartTooltipCloseHandler = function(e) {
          if (!e.target.closest('.activity-heart')) {
            document.querySelectorAll('.heart-tooltip').forEach(tooltip => {
              tooltip.style.display = 'none';
            });
          }
        };
        document.addEventListener('click', document._heartTooltipCloseHandler);
      }

      enhancedCount++;
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
    if (['quiz', 'training', 'holiday', 'profile_update', 'new_member', 'avatar_emotion'].includes(className)) {
      return className;
    }
  }
  
  // Fallback to data attribute
  return card.getAttribute('data-activity-type');
}

// Helper function to extract activity ID from card
function getActivityIdFromCard(card) {
  const attrId = card.getAttribute('data-activity-id');
  if (attrId) {
    console.log('Activity ID from attribute:', attrId);
    return attrId;
  }

  // Fallback: generate hash like activity-likes.js does
  const title = card.querySelector('.activity-title')?.textContent || '';
  const detail = card.querySelector('.activity-detail')?.textContent || '';
  const time = card.querySelector('.activity-time')?.textContent || '';

  // Create a simple hash of the content
  let hash = 0;
  const str = `${title}|${detail}|${time}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  const generatedId = 'activity_' + Math.abs(hash).toString(16);
  console.log('Generated activity ID:', generatedId);
  return generatedId;
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

// Make the enhancement function globally available
window.enhanceActivityLikesTooltips = enhanceActivityLikesTooltips;

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