// Check holiday cards initialization
console.log("Debugging holiday cards...");

document.addEventListener('DOMContentLoaded', () => {
  // Check if we have the container
  const container = document.getElementById('entitlements-cards-container');
  if (!container) {
    console.error('Container #entitlements-cards-container not found');
    return;
  }

  // Check Supabase connection
  if (!window.supabase) {
    console.error('Supabase client not available');
    return;
  }

  // Check if loadStaffEntitlementCards is defined
  if (typeof loadStaffEntitlementCards !== 'function') {
    console.error('loadStaffEntitlementCards function is not defined');
    return;
  }

  // Check if we're on the holidays view or admin dashboard
  const activeSection = document.querySelector('.view.active');
  console.log('Active section:', activeSection?.id);

  setTimeout(() => {
    console.log('Explicitly calling loadStaffEntitlementCards()');
    loadStaffEntitlementCards();
  }, 2000);
});