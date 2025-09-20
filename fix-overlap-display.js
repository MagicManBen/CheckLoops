// JavaScript utility to update the page right away without requiring a reload
// This fixes the overlap warnings display by targeting the specific elements

(function fixHolidayOverlapDisplay() {
  // Helper function to format a user ID properly
  function formatUserName(userId, email = null) {
    if (!userId) return 'Unknown User';
    
    // If we have an email, extract a name from it
    if (email) {
      const namePart = email.split('@')[0];
      return namePart
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
    }
    
    // Otherwise just format the user ID more nicely
    return `User ${userId.slice(0, 8)}...`;
  }
  
  // Find all elements that might contain the problematic user ID
  const overlapElements = document.querySelectorAll('#overlap-list strong');
  
  if (overlapElements.length === 0) {
    console.log('No overlap elements found to fix');
    return;
  }
  
  console.log(`Found ${overlapElements.length} overlap elements to check`);
  
  // Loop through and fix any that start with "User a995b5"
  let fixedCount = 0;
  overlapElements.forEach(element => {
    const text = element.textContent || '';
    
    // Check if this is a truncated user ID
    if (text.startsWith('User ') && text.includes('…')) {
      // This is a user ID that needs fixing
      const userId = text.replace('User ', '').replace('…', '');
      
      // For this specific user ID we know it's Ben Howard
      if (userId.startsWith('a995b5')) {
        element.textContent = 'Ben Howard';
        fixedCount++;
      }
      // We can add more known users here if needed
    }
  });
  
  console.log(`Fixed ${fixedCount} overlap user displays`);
})();