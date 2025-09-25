// Debug script for testing holiday cards display
console.log("Holiday cards testing script loaded");

// Wait for document to be ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("Running diagnostics on holiday cards...");
  
  // Check if entitlement-card-layout.js is loaded
  console.log("Looking for loadStaffEntitlementCards function:", typeof loadStaffEntitlementCards === 'function' ? "Found" : "Not found");
  
  // Check if the entitlement-management section exists
  const entitlementSection = document.getElementById('entitlement-management');
  console.log("Entitlement management section:", entitlementSection ? "Found" : "Not found");
  
  if (entitlementSection) {
    // Check if the section is active
    console.log("Section active status:", entitlementSection.classList.contains('active') ? "Active" : "Not active");
    
    // Check if the cards container exists
    const cardsContainer = entitlementSection.querySelector('.entitlements-cards-container');
    console.log("Cards container:", cardsContainer ? "Found" : "Not found");
    
    if (cardsContainer) {
      console.log("Cards container current HTML:", cardsContainer.innerHTML);
    }
  }
  
  // Test Supabase connection
  if (window.supabase) {
    console.log("Testing Supabase connection...");
    
    // Check if we can query the holidays table
    window.supabase
      .from('holidays')
      .select('*')
      .limit(3)
      .then(response => {
        console.log("Holidays table query result:", response);
        console.log("Number of holiday records:", response.data?.length || 0);
      })
      .catch(error => {
        console.error("Error querying holidays table:", error);
      });
    
    // Check if we can query the master_users table
    window.supabase
      .from('master_users')
      .select('*')
      .limit(3)
      .then(response => {
        console.log("master_users table query result:", response);
        console.log("Number of user records:", response.data?.length || 0);
      })
      .catch(error => {
        console.error("Error querying master_users table:", error);
      });
  } else {
    console.error("Supabase is not available yet");
  }
  
  // After a delay, trigger loading the holiday cards if not already loaded
  setTimeout(function() {
    console.log("Checking if holiday cards have loaded...");
    const cardsContainer = document.querySelector('.entitlements-cards-container');
    
    if (cardsContainer && (!cardsContainer.innerHTML || cardsContainer.innerHTML.trim() === '')) {
      console.log("Cards container is empty, explicitly calling loadStaffEntitlementCards()");
      if (typeof loadStaffEntitlementCards === 'function') {
        loadStaffEntitlementCards();
      } else {
        console.error("loadStaffEntitlementCards function not available");
      }
    } else if (cardsContainer) {
      console.log("Cards container has content:", cardsContainer.innerHTML.length, "characters");
    } else {
      console.error("Cards container not found at check time");
    }
  }, 3000);
});

// Function to manually trigger card loading
window.forceLoadHolidayCards = function() {
  console.log("Manually forcing holiday cards to load");
  if (typeof loadStaffEntitlementCards === 'function') {
    loadStaffEntitlementCards();
    return "Holiday cards loading triggered";
  } else {
    const error = "loadStaffEntitlementCards function not available";
    console.error(error);
    return error;
  }
};