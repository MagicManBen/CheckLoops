// Ensure holiday cards initialize properly
console.log("Holiday cards initializer loaded");

document.addEventListener('DOMContentLoaded', () => {
  // First check if entitlement-management section exists
  const entitlementSection = document.getElementById('entitlement-management');
  if (entitlementSection) {
    console.log('Found entitlement-management section');
    
    // Check if entitlements-cards-container exists
    const cardsContainer = entitlementSection.querySelector('.entitlements-cards-container');
    if (cardsContainer) {
      console.log('Found entitlements-cards-container, will initialize cards');
      
      // Use setTimeout to ensure everything is loaded
      setTimeout(() => {
        console.log('Initializing loadStaffEntitlementCards()');
        if (typeof loadStaffEntitlementCards === 'function') {
          loadStaffEntitlementCards();
        } else {
          console.error('loadStaffEntitlementCards function not available');
        }
      }, 1000);
    } else {
      console.error('entitlements-cards-container not found');
    }
  } else {
    console.error('entitlement-management section not found');
  }

  // Also listen for section changes
  document.body.addEventListener('sectionChanged', (event) => {
    console.log('Section changed event detected:', event.detail);
    if (event.detail?.sectionId === 'entitlement-management') {
      setTimeout(() => {
        console.log('Section changed to entitlement-management, loading cards');
        if (typeof loadStaffEntitlementCards === 'function') {
          loadStaffEntitlementCards();
        }
      }, 500);
    }
  });

  // Forcibly check every 3 seconds for the first 15 seconds
  let attempts = 0;
  const checkInterval = setInterval(() => {
    if (attempts >= 5) {
      clearInterval(checkInterval);
      return;
    }
    
    attempts++;
    console.log(`Attempt ${attempts} to initialize holiday cards`);
    
    const activeSection = document.querySelector('.view.active');
    if (activeSection && activeSection.id === 'entitlement-management') {
      if (typeof loadStaffEntitlementCards === 'function') {
        console.log('Found active entitlement section, loading cards');
        loadStaffEntitlementCards();
      }
    }
  }, 3000);
});