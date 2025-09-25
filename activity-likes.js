/**
 * Activity Likes functionality for CheckLoops
 * Adds social-like functionality to activity cards with confetti and heart icons
 */

// Initialize activity likes system
const ActivityLikes = (function() {
  // Keep track of already liked activities
  let likedActivities = new Set();
  
  // Store subscription object for cleanup
  let subscription = null;
  
  /**
   * Initialize the activity likes system
   * @param {Object} supabaseClient - The initialized Supabase client
   * @param {string} userId - Current user's ID
   * @param {string} siteId - Current site ID
   */
  async function initialize(supabaseClient, userId, siteId) {
    if (!supabaseClient || !userId || !siteId) {
      console.error('ActivityLikes: Missing required parameters for initialization');
      return;
    }
    
    try {
      // Fetch existing likes for the current user (for tracking what the user has liked)
      const { data: userLikes, error } = await supabaseClient
        .from('activity_likes')
        .select('activity_type, activity_id')
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error fetching user likes:', error);
      } else if (userLikes) {
        // Store liked activities in our Set
        userLikes.forEach(like => {
          const likeKey = `${like.activity_type}:${like.activity_id}`;
          likedActivities.add(likeKey);
        });
        console.log(`Loaded ${userLikes.length} existing likes for current user`);
      }
      
      // IMPROVEMENT: Also fetch ALL likes for the current site to show hearts from everyone
      const { data: allSiteLikes, error: siteLikesError } = await supabaseClient
        .from('activity_likes')
        .select('activity_type, activity_id')
        .eq('site_id', siteId);
        
      if (siteLikesError) {
        console.error('Error fetching site likes:', siteLikesError);
      } else if (allSiteLikes && allSiteLikes.length > 0) {
        console.log(`Found ${allSiteLikes.length} total likes for the site`);
      }
      
      // Setup realtime subscription for likes
      setupRealtimeSubscription(supabaseClient, siteId);
      
      // Add event listeners to activity items and display existing likes from all users
      setupEventListeners(allSiteLikes || []);
    } catch (err) {
      console.error('Error initializing ActivityLikes:', err);
    }
  }
  
  /**
   * Set up realtime subscription for new likes
   */
  function setupRealtimeSubscription(supabaseClient, siteId) {
    // Clean up any existing subscription
    if (subscription) {
      subscription.unsubscribe();
    }
    
    // Subscribe to realtime changes on the activity_likes table
    subscription = supabaseClient
      .channel('activity-likes-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'activity_likes',
        filter: `site_id=eq.${siteId}`
      }, handleRealtimeChange)
      .subscribe();
      
    console.log('Realtime subscription set up for activity likes');
  }
  
  /**
   * Handle realtime changes from Supabase
   */
  function handleRealtimeChange(payload) {
    console.log('Received realtime update for likes:', payload);
    
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    if (eventType === 'INSERT') {
      // Someone liked an activity
      const likeKey = `${newRecord.activity_type}:${newRecord.activity_id}`;
      updateActivityCardLike(likeKey, true);
    } else if (eventType === 'DELETE') {
      // Someone unliked an activity
      const likeKey = `${oldRecord.activity_type}:${oldRecord.activity_id}`;
      updateActivityCardLike(likeKey, false);
    }
  }
  
  /**
   * Set up double-click event listeners on activity cards
   * @param {Array} allSiteLikes - Optional array of all likes for the site
   */
  function setupEventListeners(allSiteLikes = []) {
    // Find all activity cards and add double click handlers
    const activityCards = document.querySelectorAll('.activity-item');
    
    // Create a map of all liked activities across all users
    const allLikedActivitiesMap = new Map();
    
    // Add site-wide likes to the map
    if (allSiteLikes && allSiteLikes.length > 0) {
      allSiteLikes.forEach(like => {
        const likeKey = `${like.activity_type}:${like.activity_id}`;
        allLikedActivitiesMap.set(likeKey, true);
      });
    }
    
    activityCards.forEach(card => {
      // Remove any existing event listeners first
      card.removeEventListener('dblclick', handleActivityDoubleClick);
      
      // Add the new event listener
      card.addEventListener('dblclick', handleActivityDoubleClick);
      
      // Get activity data
      const activityType = getActivityType(card);
      const activityId = getActivityId(card);
      
      if (activityType && activityId) {
        const likeKey = `${activityType}:${activityId}`;
        
        // Check if this activity was liked by current user
        if (likedActivities.has(likeKey)) {
          addHeartToActivity(card);
        } 
        // IMPROVEMENT: Also show hearts for activities liked by any user
        else if (allLikedActivitiesMap.has(likeKey)) {
          addHeartToActivity(card);
        }
      }
    });
    
    console.log(`Added double-click handlers to ${activityCards.length} activity cards`);
  }
  
  /**
   * Handle double-click on activity card
   * @param {Event} event - The click event
   */
  async function handleActivityDoubleClick(event) {
    const card = event.currentTarget;
    
    // Skip if this is the current user's own activity
    if (card.querySelector('.activity-content [style*="YOU"]')) {
      return;
    }
    
    // Get the necessary data for this activity
    const activityType = getActivityType(card);
    const activityId = getActivityId(card);
    
    if (!activityType || !activityId) {
      console.error('Could not determine activity type or ID for like action');
      return;
    }
    
    const likeKey = `${activityType}:${activityId}`;
    const isAlreadyLiked = likedActivities.has(likeKey);
    
    try {
      const supabase = window.supabase;
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        console.error('User not authenticated');
        return;
      }
      
      // Get user and site information
      const userId = session.user.id;
      const { data: userData } = await supabase
        .from('master_users')
        .select('site_id')
        .eq('auth_user_id', userId)
        .single();
        
      if (!userData || !userData.site_id) {
        console.error('Could not determine site ID for user');
        return;
      }
      
      const siteId = userData.site_id;
      
      if (isAlreadyLiked) {
        // Unlike the activity
        const { error } = await supabase
          .from('activity_likes')
          .delete()
          .match({
            user_id: userId,
            activity_type: activityType,
            activity_id: activityId
          });
          
        if (error) {
          console.error('Error removing like:', error);
          return;
        }
        
        // Update local state
        likedActivities.delete(likeKey);
        
        // Update UI
        removeHeartFromActivity(card);
        
      } else {
        // Like the activity - add to database
        const { error } = await supabase
          .from('activity_likes')
          .insert({
            user_id: userId,
            site_id: siteId,
            activity_type: activityType,
            activity_id: activityId
          });
          
        if (error) {
          // Ignore unique constraint errors (already liked)
          if (error.code !== '23505') {
            console.error('Error adding like:', error);
            return;
          }
        }
        
        // Update local state
        likedActivities.add(likeKey);
        
        // Show confetti and heart
        showConfetti(card);
        addHeartToActivity(card);
      }
    } catch (err) {
      console.error('Error processing activity like:', err);
    }
  }
  
  /**
   * Extract activity type from card element
   */
  function getActivityType(cardElement) {
    // Try to extract from the element's classList first
    for (const className of cardElement.classList) {
      if (['quiz', 'training', 'holiday', 'profile_update', 'new_member'].includes(className)) {
        return className;
      }
    }
    
    // Fallback to data attribute if added
    return cardElement.getAttribute('data-activity-type');
  }
  
  /**
   * Extract activity ID from card element or generate one based on content
   */
  function getActivityId(cardElement) {
    // First check if we have a data attribute
    const activityId = cardElement.getAttribute('data-activity-id');
    if (activityId) {
      return activityId;
    }
    
    // If no ID, generate a hash of the content to serve as an identifier
    const title = cardElement.querySelector('.activity-title')?.textContent || '';
    const detail = cardElement.querySelector('.activity-detail')?.textContent || '';
    const time = cardElement.querySelector('.activity-time')?.textContent || '';
    
    // Create a simple hash of the content
    return hashString(`${title}|${detail}|${time}`);
  }
  
  /**
   * Generate a simple hash string from text
   */
  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return 'activity_' + Math.abs(hash).toString(16);
  }
  
  /**
   * Show confetti animation on an element
   */
  function showConfetti(element) {
    if (typeof fireConfetti !== 'function') {
      console.error('Confetti function not available');
      return;
    }
    
    // Get element position for confetti origin
    const rect = element.getBoundingClientRect();
    const x = (rect.left + rect.right) / 2 / window.innerWidth;
    const y = (rect.top + rect.bottom) / 2 / window.innerHeight;
    
    // Create confetti with custom config
    fireConfetti({
      particleCount: 50,
      spread: 70,
      origin: { x, y },
      colors: ['#ff6b6b', '#ff8787', '#fa5252', '#f03e3e', '#e03131']
    });
  }
  
  /**
   * Add heart icon to liked activity
   */
  function addHeartToActivity(cardElement) {
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
  
  /**
   * Remove heart icon from unliked activity
   */
  function removeHeartFromActivity(cardElement) {
    const heart = cardElement.querySelector('.activity-heart');
    if (heart) {
      heart.remove();
    }
  }
  
  /**
   * Update activity card like status
   */
  function updateActivityCardLike(likeKey, isLiked) {
    // Find all activity cards
    const activityCards = document.querySelectorAll('.activity-item');
    
    activityCards.forEach(card => {
      const activityType = getActivityType(card);
      const activityId = getActivityId(card);
      
      if (activityType && activityId) {
        const cardLikeKey = `${activityType}:${activityId}`;
        
        // If this matches the updated activity
        if (cardLikeKey === likeKey) {
          if (isLiked) {
            addHeartToActivity(card);
          } else {
            removeHeartFromActivity(card);
          }
        }
      }
    });
  }
  
  // Clean up resources
  function cleanup() {
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }
  }
  
  // Public API
  return {
    initialize,
    cleanup,
    setupEventListeners
  };
})();

// Add function to window for external access
window.initializeActivityLikes = async function() {
  try {
    const { data: { session } } = await window.supabase.auth.getSession();
    
    if (session && session.user) {
      const { data: userData } = await window.supabase
        .from('master_users')
        .select('site_id')
        .eq('auth_user_id', session.user.id)
        .single();
        
      if (userData && userData.site_id) {
        await ActivityLikes.initialize(window.supabase, session.user.id, userData.site_id);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error initializing activity likes:', error);
    return false;
  }
};

// Auto-initialize when activity feed is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if we need to re-initialize when the activity feed is updated
  const activityFeed = document.getElementById('activity-feed');
  
  if (activityFeed) {
    // Use a MutationObserver to detect when activity feed content changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Activity feed was updated, re-attach event listeners
          ActivityLikes.setupEventListeners();
        }
      }
    });
    
    // Start observing
    observer.observe(activityFeed, { childList: true });
  }
});
