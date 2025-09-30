/**
 * Fix for activity likes functionality to ensure hearts from all users are visible
 */

// Modify the initialize function to load ALL likes for the site, not just the current user's likes
async function fixActivityLikes() {
  console.log('Applying activity likes fix...');
  
  // Check if ActivityLikes exists
  if (!window.ActivityLikes) {
    console.error('ActivityLikes module not found');
    return false;
  }
  
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
    
    // Fetch ALL likes for this site (not just for the current user)
    const { data: allSiteLikes, error } = await window.supabase
      .from('activity_likes')
      .select('activity_type, activity_id')
      .eq('site_id', userData.site_id);
      
    if (error) {
      console.error('Error fetching site likes:', error);
      return false;
    } 
    
    // Find all activity cards and add hearts to them if they have likes
    if (allSiteLikes && allSiteLikes.length > 0) {
      console.log(`Found ${allSiteLikes.length} likes across the site`);
      
      // Create a map to store which activities have likes
      const likedActivitiesMap = new Map();
      
      // Add all likes to the map
      allSiteLikes.forEach(like => {
        const likeKey = `${like.activity_type}:${like.activity_id}`;
        likedActivitiesMap.set(likeKey, true);
      });
      
      // Find all activity cards
      const activityCards = document.querySelectorAll('.activity-item');
      
      // Add hearts to the liked activities
      activityCards.forEach(card => {
        // Get activity data
        let activityType = null;
        
        // Try to extract from the element's classList first
        for (const className of card.classList) {
          if (['quiz', 'training', 'holiday', 'profile_update', 'new_member'].includes(className)) {
            activityType = className;
            break;
          }
        }
        
        // Fallback to data attribute if added
        if (!activityType) {
          activityType = card.getAttribute('data-activity-type');
        }
        
        // Extract activity ID
        let activityId = card.getAttribute('data-activity-id');
        
        // If we have both pieces of info, check if this activity has been liked
        if (activityType && activityId) {
          const likeKey = `${activityType}:${activityId}`;
          
          // Check if this activity was liked by anyone
          if (likedActivitiesMap.has(likeKey)) {
            // Add heart to the activity card
            addHeartToActivityCard(card);
          }
        }
      });
      
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('Error in fixActivityLikes:', err);
    return false;
  }
}

// Helper function to add heart to activity card
function addHeartToActivityCard(cardElement) {
  // Check if heart already exists
  if (cardElement.querySelector('.activity-heart')) {
    return;
  }
  
  // Create heart element
  const heartElement = document.createElement('div');
  heartElement.className = 'activity-heart';
  heartElement.innerHTML = '❤️';
  heartElement.style.cssText = 
    'position: absolute; top: 8px; right: 8px; font-size: 18px; ' +
    'animation: pulse 1.5s infinite; cursor: pointer; z-index: 2;';
  
  // Ensure card has position relative for absolute positioning
  if (getComputedStyle(cardElement).position !== 'relative') {
    cardElement.style.position = 'relative';
  }
  
  // Add to card
  cardElement.appendChild(heartElement);
}

// Run the fix when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Wait a bit for the activity likes to be initialized first
  setTimeout(() => {
    fixActivityLikes().then(result => {
      console.log('Activity likes fix applied:', result);
    });
  }, 1500); // Wait 1.5 seconds to ensure the main script has run
});

// Re-apply fix when activity feed is updated
const activityFeed = document.getElementById('activity-feed');
if (activityFeed) {
  // Use a MutationObserver to detect when activity feed content changes
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Activity feed was updated, apply fix again after a short delay
        setTimeout(() => {
          fixActivityLikes().then(result => {
            console.log('Activity likes fix re-applied after feed update:', result);
          });
        }, 500);
        break;
      }
    }
  });
  
  // Start observing
  observer.observe(activityFeed, { childList: true });
}