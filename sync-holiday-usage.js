// Function to sync approved holiday totals from 4_holiday_requests to master_users
async function syncHolidayUsage() {
  console.log('=== Starting Holiday Usage Sync ===');

  if (!window.supabase) {
    console.error('Supabase client not available');
    return { success: false, error: 'Supabase client not available' };
  }

  try {
    // Step 1: Get all approved holiday requests grouped by user
    console.log('Fetching approved holiday requests...');
    const { data: holidayRequests, error: requestError } = await window.supabase
      .from('4_holiday_requests')
      .select('user_id, total_hours, total_sessions, status')
      .eq('status', 'approved');

    if (requestError) {
      console.error('Error fetching holiday requests:', requestError);
      return { success: false, error: requestError };
    }

    console.log(`Found ${holidayRequests?.length || 0} approved holiday requests`);

    // Step 2: Calculate totals per user
    const userTotals = {};

    if (holidayRequests && holidayRequests.length > 0) {
      holidayRequests.forEach(request => {
        if (!userTotals[request.user_id]) {
          userTotals[request.user_id] = {
            total_hours: 0,
            total_sessions: 0
          };
        }

        // Add hours and sessions from this request
        userTotals[request.user_id].total_hours += parseFloat(request.total_hours || 0);
        userTotals[request.user_id].total_sessions += parseFloat(request.total_sessions || 0);
      });
    }

    console.log('Calculated totals by user:', userTotals);

    // Step 3: Update each user in master_users
    const updatePromises = [];
    let successCount = 0;
    let errorCount = 0;

    for (const [userId, totals] of Object.entries(userTotals)) {
      const updateData = {
        holidays_used_hours: totals.total_hours,
        holidays_used_sessions: totals.total_sessions,
        updated_at: new Date().toISOString()
      };

      console.log(`Updating user ${userId} with:`, updateData);

      const updatePromise = window.supabase
        .from('master_users')
        .update(updateData)
        .eq('auth_user_id', userId)
        .then(({ data, error }) => {
          if (error) {
            console.error(`Error updating user ${userId}:`, error);
            errorCount++;
            return { userId, success: false, error };
          }
          successCount++;
          return { userId, success: true };
        });

      updatePromises.push(updatePromise);
    }

    // Step 4: Also reset to 0 for users with no approved holidays
    console.log('Resetting holiday usage for users with no approved requests...');

    // Get all users who should be reset (those not in userTotals)
    const { data: allUsers, error: usersError } = await window.supabase
      .from('master_users')
      .select('auth_user_id')
      .not('auth_user_id', 'is', null);

    if (!usersError && allUsers) {
      const usersToReset = allUsers.filter(user => !userTotals[user.auth_user_id]);

      console.log(`Resetting ${usersToReset.length} users with no approved holidays`);

      for (const user of usersToReset) {
        const resetPromise = window.supabase
          .from('master_users')
          .update({
            holidays_used_hours: 0,
            holidays_used_sessions: 0,
            updated_at: new Date().toISOString()
          })
          .eq('auth_user_id', user.auth_user_id)
          .then(({ error }) => {
            if (error) {
              console.error(`Error resetting user ${user.auth_user_id}:`, error);
              errorCount++;
              return { userId: user.auth_user_id, success: false, error };
            }
            successCount++;
            return { userId: user.auth_user_id, success: true };
          });

        updatePromises.push(resetPromise);
      }
    }

    // Wait for all updates to complete
    const results = await Promise.all(updatePromises);

    console.log(`=== Sync Complete: ${successCount} successful, ${errorCount} errors ===`);

    // Step 5: Reload the staff entitlement cards if the function exists
    if (typeof window.loadStaffEntitlementCards === 'function') {
      console.log('Reloading staff entitlement cards...');
      setTimeout(() => window.loadStaffEntitlementCards(), 500);
    }

    return {
      success: true,
      summary: {
        totalUsersUpdated: successCount,
        totalErrors: errorCount,
        userTotals: userTotals
      }
    };

  } catch (error) {
    console.error('Unexpected error in syncHolidayUsage:', error);
    return { success: false, error: error.message };
  }
}

// Function to manually trigger sync from console or UI
window.syncHolidayUsage = syncHolidayUsage;

// Auto-sync when the entitlement cards are loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for other scripts to load
  setTimeout(() => {
    if (!window.holidayUsageSyncListener && window.loadStaffEntitlementCards) {
      window.holidayUsageSyncListener = true;

      // Override the original loadStaffEntitlementCards to include syncing
      const originalLoadCards = window.loadStaffEntitlementCards;

      window.loadStaffEntitlementCards = async function() {
        console.log('Running holiday usage sync before loading cards...');

        // Sync holiday usage first
        const syncResult = await syncHolidayUsage();

        if (!syncResult.success) {
          console.error('Holiday sync failed, but continuing to load cards');
        }

        // Then call the original function
        if (originalLoadCards) {
          return originalLoadCards.apply(this, arguments);
        }
      };

      console.log('Holiday usage sync listener installed');
    }
  }, 1000);
});

// Also sync when holiday requests are approved
if (!window.holidayApprovalSyncListener) {
  window.holidayApprovalSyncListener = true;

  // Hook into the approval function if it exists
  const originalApproveHoliday = window.approveHolidayRequest;

  if (originalApproveHoliday) {
    window.approveHolidayRequest = async function() {
      // Call original function
      const result = await originalApproveHoliday.apply(this, arguments);

      // Then sync holiday usage
      console.log('Syncing holiday usage after approval...');
      await syncHolidayUsage();

      return result;
    };

    console.log('Holiday approval sync listener installed');
  }
}

console.log('Holiday usage sync script loaded. Call syncHolidayUsage() to manually sync.');